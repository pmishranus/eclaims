const ExcelMassUploadUtil = require('./excelMassUploadUtil');
const { ApplicationConstants } = require('./constant');
const { ApplicationException } = require('./customErrors');
const CommonRepo = require('../repository/util.repo');
const UserUtil = require('./userUtil');
const EclaimService = require('./eclaimService');
const DateUtils = require('./dateUtil');
const { validateWbsCodes } = require('./wbsValidation.service');

/**
 * Excel Mass Upload Service
 * Converts Java ExcelMassUploadServiceImpl to Node.js
 * Handles Excel file processing and data transformation for mass upload operations
 */
class ExcelMassUploadService {

    /**
     * Uploads and processes Excel file
     * @param {Object} file - The uploaded file object
     * @param {string} claimCode - The claim code
     * @param {string} token - The authorization token
     * @param {string} ulu - Unit Level Unit code
     * @param {string} fdlu - Faculty Department Level Unit code
     * @param {string} period - Time period
     * @param {string} noOfHeaderRows - Number of header rows to skip
     * @returns {Promise<Object>} Excel mass upload response
     */
    static async uploadExcel(file, claimCode, token, ulu, fdlu, period, noOfHeaderRows) {
        console.log("ExcelMassUploadService uploadExcel start()");

        let excelMassUploadResponse = null;
        let excelMassUploadRequest = null;

        // Validate input parameters
        if (!claimCode || claimCode.trim() === '') {
            throw new ApplicationException("Please pass valid Claim Type");
        }

        if (!ulu || !fdlu || !period || ulu.trim() === '' || fdlu.trim() === '' || period.trim() === '') {
            throw new ApplicationException("Please pass valid input. Ulu/Fdlu/Period missing.");
        }

        try {
            // Process Excel file based on claim code
            switch (claimCode) {
                case ApplicationConstants.CLAIM_TYPE_101: // PTT
                    excelMassUploadResponse = await this.populateExcelForPTT(
                        file, claimCode, token, ulu, fdlu, period, noOfHeaderRows, excelMassUploadResponse
                    );
                    break;

                case ApplicationConstants.CLAIM_TYPE_102: // CW
                    excelMassUploadResponse = await this.populateExcelForCW(
                        file, claimCode, token, ulu, fdlu, period, noOfHeaderRows, excelMassUploadResponse
                    );
                    break;

                case ApplicationConstants.CLAIM_TYPE_103:
                case ApplicationConstants.CLAIM_TYPE_104: // OT
                    excelMassUploadResponse = await this.populateExcelForOT(
                        file, claimCode, token, ulu, fdlu, period, noOfHeaderRows, excelMassUploadResponse
                    );
                    break;

                default:
                    throw new ApplicationException(`Unsupported claim type: ${claimCode}`);
            }

        } catch (error) {
            console.error('Error in uploadExcel:', error);
            if (error instanceof ApplicationException) {
                throw error;
            }
            throw new ApplicationException(`Error processing Excel file: ${error.message}`);
        }

        console.log("ExcelMassUploadService uploadExcel end()");
        return excelMassUploadResponse;
    }

    /**
     * Populates Excel data for PTT (Claim Type 101)
     * @param {Object} file - The uploaded file object
     * @param {string} claimCode - The claim code
     * @param {string} token - The authorization token
     * @param {string} ulu - Unit Level Unit code
     * @param {string} fdlu - Faculty Department Level Unit code
     * @param {string} period - Time period
     * @param {string} noOfHeaderRows - Number of header rows to skip
     * @param {Object} excelMassUploadResponse - The response object
     * @returns {Promise<Object>} Excel mass upload response
     */
    static async populateExcelForPTT(file, claimCode, token, ulu, fdlu, period, noOfHeaderRows, excelMassUploadResponse) {
        try {
            // Read Excel file
            const excelMassUploadRequest = ExcelMassUploadUtil.readMassUploadExcelForPTT(
                file.buffer, noOfHeaderRows, claimCode
            );

            if (!excelMassUploadRequest || excelMassUploadRequest.length === 0) {
                throw new ApplicationException(
                    "Please pass a valid excel file with data and provide correct Header Rows Count"
                );
            }

            // Validate the data
            const validatedRequests = ExcelMassUploadUtil.validateExcelMassUploadRequests(
                excelMassUploadRequest, claimCode
            );

            // Frame response
            excelMassUploadResponse = await this.frameExcelMassUploadResponse(
                validatedRequests, claimCode, token, ulu, fdlu, period
            );

            return excelMassUploadResponse;

        } catch (error) {
            console.error('Error in populateExcelForPTT:', error);
            throw error;
        }
    }

    /**
     * Populates Excel data for CW (Claim Type 102)
     * @param {Object} file - The uploaded file object
     * @param {string} claimCode - The claim code
     * @param {string} token - The authorization token
     * @param {string} ulu - Unit Level Unit code
     * @param {string} fdlu - Faculty Department Level Unit code
     * @param {string} period - Time period
     * @param {string} noOfHeaderRows - Number of header rows to skip
     * @param {Object} excelMassUploadResponse - The response object
     * @returns {Promise<Object>} Excel mass upload response
     */
    static async populateExcelForCW(file, claimCode, token, ulu, fdlu, period, noOfHeaderRows, excelMassUploadResponse) {
        try {
            // Read Excel file
            const excelMassUploadRequest = ExcelMassUploadUtil.readMassUploadExcelForCW(
                file.buffer, noOfHeaderRows, claimCode
            );

            if (!excelMassUploadRequest || excelMassUploadRequest.length === 0) {
                throw new ApplicationException(
                    "Please pass a valid excel file with data and provide correct Header Rows Count"
                );
            }

            // Validate the data
            const validatedRequests = ExcelMassUploadUtil.validateExcelMassUploadRequests(
                excelMassUploadRequest, claimCode
            );

            // Frame response
            excelMassUploadResponse = await this.frameExcelMassUploadResponse(
                validatedRequests, claimCode, token, ulu, fdlu, period
            );

            return excelMassUploadResponse;

        } catch (error) {
            console.error('Error in populateExcelForCW:', error);
            throw error;
        }
    }

    /**
     * Populates Excel data for OT (Claim Types 103, 104)
     * @param {Object} file - The uploaded file object
     * @param {string} claimCode - The claim code
     * @param {string} token - The authorization token
     * @param {string} ulu - Unit Level Unit code
     * @param {string} fdlu - Faculty Department Level Unit code
     * @param {string} period - Time period
     * @param {string} noOfHeaderRows - Number of header rows to skip
     * @param {Object} excelMassUploadResponse - The response object
     * @returns {Promise<Object>} Excel mass upload response
     */
    static async populateExcelForOT(file, claimCode, token, ulu, fdlu, period, noOfHeaderRows, excelMassUploadResponse) {
        try {
            // Read Excel file
            const excelMassUploadRequest = ExcelMassUploadUtil.readMassUploadExcelForOT(
                file.buffer, noOfHeaderRows, claimCode
            );

            if (!excelMassUploadRequest || excelMassUploadRequest.length === 0) {
                throw new ApplicationException(
                    "Please pass a valid excel file with data and provide correct Header Rows Count"
                );
            }

            // Validate the data
            const validatedRequests = ExcelMassUploadUtil.validateExcelMassUploadRequests(
                excelMassUploadRequest, claimCode
            );

            // Frame response
            excelMassUploadResponse = await this.frameExcelMassUploadResponse(
                validatedRequests, claimCode, token, ulu, fdlu, period
            );

            return excelMassUploadResponse;

        } catch (error) {
            console.error('Error in populateExcelForOT:', error);
            throw error;
        }
    }

    /**
     * Frames Excel mass upload response
     * @param {Array} excelMassUploadRequestList - List of Excel mass upload requests
     * @param {string} claimCode - The claim code
     * @param {string} token - The authorization token
     * @param {string} ulu - Unit Level Unit code
     * @param {string} fdlu - Faculty Department Level Unit code
     * @param {string} period - Time period
     * @returns {Promise<Object>} Excel mass upload response
     */
    static async frameExcelMassUploadResponse(excelMassUploadRequestList, claimCode, token, ulu, fdlu, period) {
        console.log("ExcelMassUploadService frameExcelMassUploadResponse start()");

        const excelMassUploadResponse = {
            request_payload: [],
            display_payload: [],
            matrix_payload: [],
            excelMassUploadRequestReport: excelMassUploadRequestList
        };

        const requestPayload = [];
        const displayPayload = [];

        // Check WBS elements
        const checkWbsElementRes = await this.checkWbsElement(excelMassUploadRequestList);

        // Process each Excel mass upload request
        for (const excelMassUploadRequest of excelMassUploadRequestList) {
            // Populate mass upload request DTO
            const massUploadRequestDto = await this.populateMassUploadRequestDto(
                excelMassUploadRequest, claimCode, token, ulu, fdlu, period,
                excelMassUploadRequestList, checkWbsElementRes
            );

            // Populate display response
            const excelMassUploadDisplayResponse = await this.populateExcelMassUploadDisplayResponse(
                excelMassUploadRequest, claimCode, ulu, fdlu, period, massUploadRequestDto
            );

            displayPayload.push(excelMassUploadDisplayResponse);
            requestPayload.push(massUploadRequestDto);
        }

        excelMassUploadResponse.request_payload = requestPayload;
        excelMassUploadResponse.display_payload = displayPayload;

        console.log("ExcelMassUploadService frameExcelMassUploadResponse end()");
        return excelMassUploadResponse;
    }

    /**
     * Populates mass upload request DTO from Excel mass upload request
     * @param {Object} excelMassUploadRequest - Excel mass upload request
     * @param {string} claimCode - The claim code
     * @param {string} token - The authorization token
     * @param {string} ulu - Unit Level Unit code
     * @param {string} fdlu - Faculty Department Level Unit code
     * @param {string} period - Time period
     * @param {Array} excelMassUploadRequestList - List of all requests
     * @param {Object} checkWbsElementRes - WBS element check results
     * @returns {Promise<Object>} Mass upload request DTO
     */
    static async populateMassUploadRequestDto(excelMassUploadRequest, claimCode, token, ulu, fdlu, period,
        excelMassUploadRequestList, checkWbsElementRes) {
        try {
            // Extract user information
            const userName = UserUtil.extractUsernameFromToken(token);
            const userInfoDetails = await CommonRepo.fetchUserInfo(userName);

            // Parse period
            const [month, year] = period.split(ApplicationConstants.HYPHEN);

            // Create mass upload request DTO
            const massUploadRequestDto = {
                DRAFT_ID: '', // Will be generated during processing
                REQUEST_ID: '', // Will be generated during processing
                CLAIM_TYPE: claimCode,
                STAFF_ID: excelMassUploadRequest.staffId,
                STAFF_NUSNET_ID: excelMassUploadRequest.staffId,
                FULL_NM: excelMassUploadRequest.staffName,
                ULU: ulu,
                FDLU: fdlu,
                CLAIM_MONTH: month,
                CLAIM_YEAR: year,
                WBS: excelMassUploadRequest.wbs,
                RATE_TYPE: excelMassUploadRequest.rateType,
                RATE_TYPE_AMOUNT: parseFloat(excelMassUploadRequest.amount) || 0,
                HOURS_UNIT: parseFloat(excelMassUploadRequest.hours) || 0,
                TOTAL_AMOUNT: parseFloat(excelMassUploadRequest.amount) || 0,
                REMARKS: excelMassUploadRequest.remarks || '',
                ACTION: ApplicationConstants.ACTION_SAVE,
                IS_DELETED: ApplicationConstants.N,
                CREATED_BY: userInfoDetails.STAFF_ID,
                CREATED_BY_NID: userInfoDetails.NUSNET_ID,
                CREATED_ON: new Date(),
                MODIFIED_BY: userInfoDetails.STAFF_ID,
                MODIFIED_BY_NID: userInfoDetails.NUSNET_ID,
                MODIFIED_ON: new Date(),
                validationResults: excelMassUploadRequest.validationErrors || [],
                isValid: excelMassUploadRequest.isValid || false
            };

            // Add claim type specific fields
            switch (claimCode) {
                case ApplicationConstants.CLAIM_TYPE_101: // PTT
                    massUploadRequestDto.CLAIM_START_DATE = excelMassUploadRequest.claimDate;
                    massUploadRequestDto.CLAIM_END_DATE = excelMassUploadRequest.claimDate;
                    break;

                case ApplicationConstants.CLAIM_TYPE_102: // CW
                    massUploadRequestDto.CLAIM_START_DATE = excelMassUploadRequest.startDate;
                    massUploadRequestDto.CLAIM_END_DATE = excelMassUploadRequest.endDate;
                    massUploadRequestDto.DURATION_DAYS = parseFloat(excelMassUploadRequest.duration) || 0;
                    break;

                case ApplicationConstants.CLAIM_TYPE_103:
                case ApplicationConstants.CLAIM_TYPE_104: // OT
                    massUploadRequestDto.CLAIM_START_DATE = excelMassUploadRequest.claimDate;
                    massUploadRequestDto.CLAIM_END_DATE = excelMassUploadRequest.claimDate;
                    massUploadRequestDto.START_TIME = excelMassUploadRequest.startTime;
                    massUploadRequestDto.END_TIME = excelMassUploadRequest.endTime;
                    break;
            }

            return massUploadRequestDto;

        } catch (error) {
            console.error('Error in populateMassUploadRequestDto:', error);
            throw new ApplicationException(`Error creating mass upload request DTO: ${error.message}`);
        }
    }

    /**
     * Populates Excel mass upload display response
     * @param {Object} excelMassUploadRequest - Excel mass upload request
     * @param {string} claimCode - The claim code
     * @param {string} ulu - Unit Level Unit code
     * @param {string} fdlu - Faculty Department Level Unit code
     * @param {string} period - Time period
     * @param {Object} massUploadRequestDto - Mass upload request DTO
     * @returns {Promise<Object>} Excel mass upload display response
     */
    static async populateExcelMassUploadDisplayResponse(excelMassUploadRequest, claimCode, ulu, fdlu, period, massUploadRequestDto) {
        return {
            rowNumber: excelMassUploadRequest.rowNumber,
            staffId: excelMassUploadRequest.staffId,
            staffName: excelMassUploadRequest.staffName,
            claimType: claimCode,
            ulu: ulu,
            fdlu: fdlu,
            period: period,
            wbs: excelMassUploadRequest.wbs,
            rateType: excelMassUploadRequest.rateType,
            amount: excelMassUploadRequest.amount,
            hours: excelMassUploadRequest.hours || '',
            remarks: excelMassUploadRequest.remarks || '',
            validationErrors: excelMassUploadRequest.validationErrors || [],
            isValid: excelMassUploadRequest.isValid || false,
            isProcessed: excelMassUploadRequest.isProcessed || false
        };
    }

    /**
     * Checks WBS elements for validation
     * @param {Array} excelMassUploadRequestList - List of Excel mass upload requests
     * @returns {Promise<Object>} WBS element check results
     */
    static async checkWbsElement(excelMassUploadRequestList) {
        try {
            // Extract unique WBS codes
            const wbsCodes = [...new Set(excelMassUploadRequestList.map(req => req.wbs).filter(wbs => wbs && wbs.trim() !== ''))];

            if (wbsCodes.length === 0) {
                return {};
            }

            // Call shared WBS validation service (delegates to CPI via CommonUtils)
            const { map } = await validateWbsCodes(wbsCodes);

            // Map shape expected by callers: { [wbs]: { isValid, message } }
            const checkResults = {};
            for (const code of wbsCodes) {
                const res = map?.[code];
                checkResults[code] = {
                    isValid: !!res?.isValid,
                    message: res?.message || ''
                };
            }

            return checkResults;

        } catch (error) {
            console.error('Error in checkWbsElement:', error);
            return {};
        }
    }
}

module.exports = ExcelMassUploadService;
