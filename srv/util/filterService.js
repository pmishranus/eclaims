const { ApplicationConstants } = require('./constant');
const { ApplicationException } = require('./customErrors');
const EclaimsDataRepo = require('../repository/eclaimsData.repo');

/**
 * Filter Service
 * Converts Java FilterServiceImpl to Node.js
 * Handles filtering of eclaims data based on staff ID and request status
 */
class FilterService {

    /**
     * Filters eclaims data based on request parameters
     * @param {Object} filterRequestDto - Filter request containing STAFF_ID and REQUEST_STATUS
     * @returns {Promise<Object>} Filter response with filtered data arrays
     */
    static async filterData(filterRequestDto) {
        console.log("FilterService filterData start()");

        let filterResponseDto = {
            REQ_ID: [],
            CLAIM_TYPE: [],
            PERIOD: [],
            STATUS: [],
            TASK: [],
            isError: false,
            message: ""
        };

        try {
            // Validate input
            if (!filterRequestDto.STAFF_ID || filterRequestDto.STAFF_ID.trim() === '') {
                throw new ApplicationException("Please pass valid Staff Id");
            }

            let statusIdList = [];

            // Process request status if provided
            if (filterRequestDto.REQUEST_STATUS && Array.isArray(filterRequestDto.REQUEST_STATUS) && filterRequestDto.REQUEST_STATUS.length > 0) {
                for (const statusItem of filterRequestDto.REQUEST_STATUS) {
                    if (statusItem && statusItem.REQUEST_STATUS && statusItem.REQUEST_STATUS.trim() !== '') {
                        statusIdList.push(statusItem.REQUEST_STATUS);
                    }
                }
            }

            // Fetch filter response based on whether status list is provided
            if (statusIdList.length === 0) {
                filterResponseDto = await this.fetchFilterResponse(null, filterRequestDto);
            } else {
                filterResponseDto = await this.fetchFilterResponse(statusIdList, filterRequestDto);
            }

        } catch (error) {
            console.error('Error in filterData:', error);
            if (error instanceof ApplicationException) {
                throw error;
            }
            throw new ApplicationException(`Error filtering data: ${error.message}`);
        }

        console.log("FilterService filterData end()");
        return filterResponseDto;
    }

    /**
     * Fetches filter response data from repository
     * @param {Array} statusIdList - List of status IDs to filter by (null for all)
     * @param {Object} filterRequestDto - Filter request DTO
     * @returns {Promise<Object>} Filter response DTO
     */
    static async fetchFilterResponse(statusIdList, filterRequestDto) {
        const filterResponseDto = {
            REQ_ID: [],
            CLAIM_TYPE: [],
            PERIOD: [],
            STATUS: [],
            TASK: [],
            isError: false,
            message: ""
        };

        try {
            if (!statusIdList || statusIdList.length === 0) {
                // Fetch all data without status filter
                filterResponseDto.REQ_ID = await EclaimsDataRepo.filterQueryRequestIdAndStatus(filterRequestDto.STAFF_ID);
                filterResponseDto.CLAIM_TYPE = await EclaimsDataRepo.filterQueryClaimType(filterRequestDto.STAFF_ID);
                filterResponseDto.PERIOD = await EclaimsDataRepo.filterQueryMonthAndYear(filterRequestDto.STAFF_ID);
                filterResponseDto.STATUS = await EclaimsDataRepo.filterQueryStatus(filterRequestDto.STAFF_ID);
                filterResponseDto.TASK = await EclaimsDataRepo.filterQueryTaskDetails(filterRequestDto.STAFF_ID);
            } else {
                // Fetch data with status filter
                filterResponseDto.REQ_ID = await EclaimsDataRepo.filterQueryRequestIdAndStatus(filterRequestDto.STAFF_ID, statusIdList);
                filterResponseDto.CLAIM_TYPE = await EclaimsDataRepo.filterQueryClaimType(filterRequestDto.STAFF_ID, statusIdList);
                filterResponseDto.PERIOD = await EclaimsDataRepo.filterQueryMonthAndYear(filterRequestDto.STAFF_ID, statusIdList);
                filterResponseDto.STATUS = await EclaimsDataRepo.filterQueryStatus(filterRequestDto.STAFF_ID, statusIdList);
                filterResponseDto.TASK = await EclaimsDataRepo.filterQueryTaskDetails(filterRequestDto.STAFF_ID, statusIdList);
            }

        } catch (error) {
            console.error('Error in fetchFilterResponse:', error);
            filterResponseDto.isError = true;
            filterResponseDto.message = error.message || "Error fetching filter data";
        }

        return filterResponseDto;
    }
}

module.exports = FilterService;
