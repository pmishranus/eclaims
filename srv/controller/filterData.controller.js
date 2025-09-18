const { ApplicationConstants, MessageConstants } = require("../util/constant");
const { ApplicationException } = require("../util/customErrors");
const FilterService = require("../util/filterService");

/**
 * Controller for filtering eclaims data
 * Converts Java FilterController to Node.js
 * @param {object} request - The request object containing filter parameters
 */
async function filterData(request) {
    console.log("FilterController filterData start()");

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
        // Extract filter request data
        const filterRequestDto = request.data.data;

        if (!filterRequestDto) {
            throw new ApplicationException("Filter request data is required");
        }

        // Call filter service
        filterResponseDto = await FilterService.filterData(filterRequestDto);

        if (!filterResponseDto) {
            filterResponseDto = {
                REQ_ID: [],
                CLAIM_TYPE: [],
                PERIOD: [],
                STATUS: [],
                TASK: [],
                isError: true,
                message: "Problem in fetching Filter data"
            };
        }

    } catch (error) {
        console.error('Error in filterData:', error);

        if (error instanceof ApplicationException) {
            filterResponseDto.isError = true;
            filterResponseDto.message = error.message;
        } else {
            filterResponseDto.isError = true;
            filterResponseDto.message = error.message || "An error occurred while filtering data";
        }
    }

    console.log("FilterController filterData end()");
    return filterResponseDto;
}

module.exports = { filterData };
