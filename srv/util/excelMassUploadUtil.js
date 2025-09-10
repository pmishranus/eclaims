const XLSX = require('xlsx');
const { ApplicationConstants } = require('./constant');
const { ApplicationException } = require('./customErrors');

/**
 * Excel Mass Upload Utility
 * Converts Java MassUploadExcelUtility to Node.js
 * Handles Excel file processing for mass upload operations
 */
class ExcelMassUploadUtil {

    /**
     * Checks if the file has Excel format
     * @param {Object} file - The uploaded file object
     * @returns {boolean} True if file is Excel format
     */
    static hasExcelFormat(file) {
        if (!file || !file.mimetype) {
            return false;
        }

        const excelMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
            'text/csv' // .csv
        ];

        return excelMimeTypes.includes(file.mimetype) ||
            file.originalname.toLowerCase().endsWith('.xlsx') ||
            file.originalname.toLowerCase().endsWith('.xls') ||
            file.originalname.toLowerCase().endsWith('.csv');
    }

    /**
     * Reads mass upload Excel file for PTT (Claim Type 101)
     * @param {Buffer} fileBuffer - The Excel file buffer
     * @param {string} noOfHeaderRows - Number of header rows to skip
     * @param {string} claimCode - The claim code
     * @returns {Array} Array of Excel mass upload request objects
     */
    static readMassUploadExcelForPTT(fileBuffer, noOfHeaderRows, claimCode) {
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                raw: false
            });

            if (!jsonData || jsonData.length === 0) {
                throw new ApplicationException("Excel file is empty or invalid");
            }

            const headerRowCount = parseInt(noOfHeaderRows) || 1;
            const dataRows = jsonData.slice(headerRowCount);

            if (dataRows.length === 0) {
                throw new ApplicationException("No data rows found in Excel file");
            }

            // Map data rows to ExcelMassUploadRequest objects
            const excelMassUploadRequests = dataRows.map((row, index) => {
                if (!row || row.length === 0) {
                    return null;
                }

                return {
                    rowNumber: index + headerRowCount + 1,
                    staffId: row[0] || '',
                    staffName: row[1] || '',
                    claimDate: row[2] || '',
                    hours: row[3] || '',
                    wbs: row[4] || '',
                    rateType: row[5] || '',
                    amount: row[6] || '',
                    remarks: row[7] || '',
                    claimType: claimCode,
                    isProcessed: false,
                    validationErrors: []
                };
            }).filter(item => item !== null);

            return excelMassUploadRequests;

        } catch (error) {
            console.error('Error reading PTT Excel file:', error);
            throw new ApplicationException(`Error processing Excel file: ${error.message}`);
        }
    }

    /**
     * Reads mass upload Excel file for CW (Claim Type 102)
     * @param {Buffer} fileBuffer - The Excel file buffer
     * @param {string} noOfHeaderRows - Number of header rows to skip
     * @param {string} claimCode - The claim code
     * @returns {Array} Array of Excel mass upload request objects
     */
    static readMassUploadExcelForCW(fileBuffer, noOfHeaderRows, claimCode) {
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                raw: false
            });

            if (!jsonData || jsonData.length === 0) {
                throw new ApplicationException("Excel file is empty or invalid");
            }

            const headerRowCount = parseInt(noOfHeaderRows) || 1;
            const dataRows = jsonData.slice(headerRowCount);

            if (dataRows.length === 0) {
                throw new ApplicationException("No data rows found in Excel file");
            }

            // Map data rows to ExcelMassUploadRequest objects for CW
            const excelMassUploadRequests = dataRows.map((row, index) => {
                if (!row || row.length === 0) {
                    return null;
                }

                return {
                    rowNumber: index + headerRowCount + 1,
                    staffId: row[0] || '',
                    staffName: row[1] || '',
                    startDate: row[2] || '',
                    endDate: row[3] || '',
                    duration: row[4] || '',
                    wbs: row[5] || '',
                    rateType: row[6] || '',
                    amount: row[7] || '',
                    remarks: row[8] || '',
                    claimType: claimCode,
                    isProcessed: false,
                    validationErrors: []
                };
            }).filter(item => item !== null);

            return excelMassUploadRequests;

        } catch (error) {
            console.error('Error reading CW Excel file:', error);
            throw new ApplicationException(`Error processing Excel file: ${error.message}`);
        }
    }

    /**
     * Reads mass upload Excel file for OT (Claim Types 103, 104)
     * @param {Buffer} fileBuffer - The Excel file buffer
     * @param {string} noOfHeaderRows - Number of header rows to skip
     * @param {string} claimCode - The claim code
     * @returns {Array} Array of Excel mass upload request objects
     */
    static readMassUploadExcelForOT(fileBuffer, noOfHeaderRows, claimCode) {
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                raw: false
            });

            if (!jsonData || jsonData.length === 0) {
                throw new ApplicationException("Excel file is empty or invalid");
            }

            const headerRowCount = parseInt(noOfHeaderRows) || 1;
            const dataRows = jsonData.slice(headerRowCount);

            if (dataRows.length === 0) {
                throw new ApplicationException("No data rows found in Excel file");
            }

            // Map data rows to ExcelMassUploadRequest objects for OT
            const excelMassUploadRequests = dataRows.map((row, index) => {
                if (!row || row.length === 0) {
                    return null;
                }

                return {
                    rowNumber: index + headerRowCount + 1,
                    staffId: row[0] || '',
                    staffName: row[1] || '',
                    claimDate: row[2] || '',
                    startTime: row[3] || '',
                    endTime: row[4] || '',
                    hours: row[5] || '',
                    wbs: row[6] || '',
                    rateType: row[7] || '',
                    amount: row[8] || '',
                    remarks: row[9] || '',
                    claimType: claimCode,
                    isProcessed: false,
                    validationErrors: []
                };
            }).filter(item => item !== null);

            return excelMassUploadRequests;

        } catch (error) {
            console.error('Error reading OT Excel file:', error);
            throw new ApplicationException(`Error processing Excel file: ${error.message}`);
        }
    }

    /**
     * Reads mass upload Excel file for Tax Benefit
     * @param {Buffer} fileBuffer - The Excel file buffer
     * @param {string} noOfHeaderRows - Number of header rows to skip
     * @returns {Array} Array of Excel mass upload request objects
     */
    static readMassUploadExcelForTB(fileBuffer, noOfHeaderRows) {
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                raw: false
            });

            if (!jsonData || jsonData.length === 0) {
                throw new ApplicationException("Excel file is empty or invalid");
            }

            const headerRowCount = parseInt(noOfHeaderRows) || 1;
            const dataRows = jsonData.slice(headerRowCount);

            if (dataRows.length === 0) {
                throw new ApplicationException("No data rows found in Excel file");
            }

            // Map data rows to ExcelMassUploadRequest objects for Tax Benefit
            const excelMassUploadRequests = dataRows.map((row, index) => {
                if (!row || row.length === 0) {
                    return null;
                }

                return {
                    rowNumber: index + headerRowCount + 1,
                    staffId: row[0] || '',
                    staffName: row[1] || '',
                    benefitType: row[2] || '',
                    amount: row[3] || '',
                    taxYear: row[4] || '',
                    remarks: row[5] || '',
                    isProcessed: false,
                    validationErrors: []
                };
            }).filter(item => item !== null);

            return excelMassUploadRequests;

        } catch (error) {
            console.error('Error reading Tax Benefit Excel file:', error);
            throw new ApplicationException(`Error processing Excel file: ${error.message}`);
        }
    }

    /**
     * Validates Excel mass upload request data
     * @param {Array} excelMassUploadRequests - Array of Excel mass upload requests
     * @param {string} claimCode - The claim code
     * @returns {Array} Array of validated requests with validation errors
     */
    static validateExcelMassUploadRequests(excelMassUploadRequests, claimCode) {
        if (!excelMassUploadRequests || excelMassUploadRequests.length === 0) {
            throw new ApplicationException("No data to validate");
        }

        return excelMassUploadRequests.map(request => {
            const validationErrors = [];

            // Basic validation
            if (!request.staffId || request.staffId.trim() === '') {
                validationErrors.push(`Row ${request.rowNumber}: Staff ID is required`);
            }

            if (!request.staffName || request.staffName.trim() === '') {
                validationErrors.push(`Row ${request.rowNumber}: Staff Name is required`);
            }

            // Claim type specific validation
            switch (claimCode) {
                case ApplicationConstants.CLAIM_TYPE_101: // PTT
                    if (!request.claimDate || request.claimDate.trim() === '') {
                        validationErrors.push(`Row ${request.rowNumber}: Claim Date is required`);
                    }
                    if (!request.hours || request.hours.trim() === '') {
                        validationErrors.push(`Row ${request.rowNumber}: Hours is required`);
                    }
                    break;

                case ApplicationConstants.CLAIM_TYPE_102: // CW
                    if (!request.startDate || request.startDate.trim() === '') {
                        validationErrors.push(`Row ${request.rowNumber}: Start Date is required`);
                    }
                    if (!request.endDate || request.endDate.trim() === '') {
                        validationErrors.push(`Row ${request.rowNumber}: End Date is required`);
                    }
                    break;

                case ApplicationConstants.CLAIM_TYPE_103:
                case ApplicationConstants.CLAIM_TYPE_104: // OT
                    if (!request.claimDate || request.claimDate.trim() === '') {
                        validationErrors.push(`Row ${request.rowNumber}: Claim Date is required`);
                    }
                    if (!request.startTime || request.startTime.trim() === '') {
                        validationErrors.push(`Row ${request.rowNumber}: Start Time is required`);
                    }
                    if (!request.endTime || request.endTime.trim() === '') {
                        validationErrors.push(`Row ${request.rowNumber}: End Time is required`);
                    }
                    break;
            }

            // Common validations
            if (!request.wbs || request.wbs.trim() === '') {
                validationErrors.push(`Row ${request.rowNumber}: WBS is required`);
            }

            if (!request.rateType || request.rateType.trim() === '') {
                validationErrors.push(`Row ${request.rowNumber}: Rate Type is required`);
            }

            if (!request.amount || request.amount.trim() === '') {
                validationErrors.push(`Row ${request.rowNumber}: Amount is required`);
            }

            // Update validation errors
            request.validationErrors = validationErrors;
            request.isValid = validationErrors.length === 0;

            return request;
        });
    }
}

module.exports = ExcelMassUploadUtil;
