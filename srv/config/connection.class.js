"use strict";
const DbClass = require("sap-hdbext-promisfied");
const cds = require('@sap/cds');
const LOG = cds.log('requestHandler');

module.exports = class Connection {
	/**
	 * 
	 * @param {object} request -> CAP request object
	 * @param {object} db CAP DB Object 
	 * @param {object} srv CAP srv Object
	 */
	constructor(request, db, srv) {
		this.request = request;
		this.db = db;
		this.srv = srv;
		this.dbConn = undefined;
	}

	async createConnection(fnProcessRequest) {
		let dbConn;
		let oReturnValue = this.request;
		try {
			//increase timeout
			// if (this.request) {
			// 	this.request.req.setTimeout(3600000, function () {
			// 		LOG.error("Socket Timeout");
			// 		throw new Error("Socket Timeout");
			// 	});
			// }

			//create new connection
			const config = JSON.parse(JSON.stringify(cds.env.requires.db.credentials));
			const connection = await DbClass.createConnection(config);
			dbConn = new DbClass(connection);
			const { client } = dbConn;
			client.setAutoCommit(false);

			this.dbConn = dbConn;

			//call handler
			oReturnValue = await fnProcessRequest(this);
			await this.commit(client);
		} catch (oError) {
			//log Error
			this.handleError(oError);
			//rollback Error
			if (dbConn && dbConn.client) {
				await this.rollback(dbConn.client);
			}
		} finally {
			if (dbConn && dbConn.client) {
				await this.close(dbConn.client);
			}
			return oReturnValue;
		}
	}

	commit(dbClient) {
		return new Promise((resolve, reject) => {
			dbClient.commit(err => {
				if (err) {
					reject(err);
				}
				return resolve("Commit successfull");
			});
		});
	}

	rollback(dbClient) {
		return new Promise((resolve, reject) => {
			dbClient.rollback(err => {
				if (err) reject(err);
				resolve("Rollback successfull");
			});
		}).catch(oError => {
			const sMSG = oError.message ? oError.message : "No Error Message!";
			LOG.error("Rollback failed:" + sMSG);
		});
	}
	close(dbClient) {
		return new Promise((resolve, reject) => {

			dbClient.disconnect(err => {
				if (err) {
					reject(err);
				}
				resolve("Disconnect successfull");
			});

		}).catch(oError => {
			const sMSG = oError.message ? oError.message : "No Error Message!";
			LOG.error("Disconnect failed : " + sMSG);
		});;

	}

	handleError(oError) {
		LOG.error(oError);
		if (this.request && !this.request.errors) {
			const iErrorCode = oError.code && Error.code >= 400 ? oError.code : 500;
			const sMSG = oError.message ? oError.message : "Error during processing request!";
			this.request.error({
				code: "500",
				status: iErrorCode,
				message: sMSG
			});
		}
	}

};