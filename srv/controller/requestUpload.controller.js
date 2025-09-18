const cds = require("@sap/cds");
const { ApplicationConstants, MessageConstants } = require("../util/constant");
const { ApplicationException } = require("../util/customErrors");
const CommonRepo = require("../repository/util.repo");
const UserUtil = require("../util/userUtil");
const ExcelMassUploadUtil = require("../util/excelMassUploadUtil");
const ExcelMassUploadService = require("../util/excelMassUploadService");

/**
 * Controller for Excel file upload and processing
 * Converts Java ExcelMassUploadController to Node.js
 * @param {object} request - The request object containing file and parameters
 */
async function requestUpload(request) {
    console.log("RequestUploadController requestUpload start()");

    let message = "";
    let excelUploadResponseDto = {
        message: "",
        isError: false,
        response: null
    };

    try {
        // Extract parameters from request data
        const {
            claimFile,
            claimCode,
            ulu,
            fdlu,
            period,
            noOfHeaderRows
        } = request.data;

        // Validate file
        if (!claimFile) {
            message = "Please upload an excel file!";
            excelUploadResponseDto.message = message;
            excelUploadResponseDto.isError = true;
            return excelUploadResponseDto;
        }

        // Check if file has Excel format
        if (!ExcelMassUploadUtil.hasExcelFormat(claimFile)) {
            message = "Please upload an excel file!";
            excelUploadResponseDto.message = message;
            excelUploadResponseDto.isError = true;
            return excelUploadResponseDto;
        }

        // Extract authorization token from request headers
        const token = request.headers.authorization || request.headers.Authorization;
        if (!token) {
            throw new ApplicationException("Authorization token is required");
        }

        // Validate required parameters
        if (!claimCode || claimCode.trim() === '') {
            throw new ApplicationException("Claim code is required");
        }

        if (!ulu || !fdlu || !period || ulu.trim() === '' || fdlu.trim() === '' || period.trim() === '') {
            throw new ApplicationException("ULU, FDLU, and Period are required");
        }

        if (!noOfHeaderRows || noOfHeaderRows.trim() === '') {
            throw new ApplicationException("Number of header rows is required");
        }

        // Extract username using utility function
        const userName = UserUtil.extractUsername(request);
        if (!userName) {
            throw new ApplicationException("User not found");
        }

        // Set success message
        message = `Uploaded the Claim Type file successfully: ${claimFile.originalname}`;

        // Process Excel file
        const response = await ExcelMassUploadService.uploadExcel(
            claimFile,
            claimCode,
            token,
            ulu,
            fdlu,
            period,
            noOfHeaderRows
        );

        if (response) {
            excelUploadResponseDto.message = message;
            excelUploadResponseDto.isError = false;
            excelUploadResponseDto.response = response;
        } else {
            throw new ApplicationException("Failed to process Excel file");
        }

    } catch (error) {
        console.error('Error in requestUpload:', error);

        if (error instanceof ApplicationException) {
            excelUploadResponseDto.message = error.message;
        } else {
            excelUploadResponseDto.message = "An error occurred while processing the Excel file";
        }

        excelUploadResponseDto.isError = true;
        excelUploadResponseDto.response = null;
    }

    console.log("RequestUploadController requestUpload end()");
    return excelUploadResponseDto;
}

/**
 * Handles file upload with multer middleware
 * This function processes the uploaded file and extracts parameters
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Next middleware function
 */
async function handleFileUpload(req, res, next) {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload an excel file!",
                isError: true
            });
        }

        // Extract parameters from form data
        const claimCode = req.body.claimCode;
        const ulu = req.body.ulu;
        const fdlu = req.body.fdlu;
        const period = req.body.period;
        const noOfHeaderRows = req.body.noOfHeaderRows;

        // Validate required parameters
        if (!claimCode || !ulu || !fdlu || !period || !noOfHeaderRows) {
            return res.status(400).json({
                message: "Missing required parameters: claimCode, ulu, fdlu, period, noOfHeaderRows",
                isError: true
            });
        }

        // Create request data object
        const requestData = {
            claimFile: req.file,
            claimCode: claimCode,
            ulu: ulu,
            fdlu: fdlu,
            period: period,
            noOfHeaderRows: noOfHeaderRows
        };

        // Create mock request object for processing
        const mockRequest = {
            data: requestData,
            headers: req.headers,
            user: req.user
        };

        // Process the upload
        const result = await requestUpload(mockRequest);

        // Return response
        if (result.isError) {
            return res.status(400).json(result);
        } else {
            return res.status(200).json(result);
        }

    } catch (error) {
        console.error('Error in handleFileUpload:', error);
        return res.status(500).json({
            message: "Internal server error",
            isError: true
        });
    }
}

module.exports = {
    requestUpload,
    handleFileUpload
};
