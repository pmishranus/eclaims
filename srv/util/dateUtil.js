const {
    format,
    parse,
    parseISO,
    formatISO,
    addDays,
    startOfDay,
    differenceInDays,
    isBefore,
    isAfter,
    isSameDay,
} = require("date-fns");
const { enUS } = require("date-fns/locale");

// Constants
const DATE_TIME_FORMATTER = "yyyy-MM-dd'T'HH:mm:ss.SSS";
const APPN_DATE_FORMATTER = "dd.MM.yyyy";
const APPN_DATE_FORMATTER1 = "yyyy-MM-dd";

// Utility functions
const convertForMassUploadFormat = inputDate => {
    return inputDate ? format(inputDate, APPN_DATE_FORMATTER1, { locale: enUS }) : "";
};

const extractTimeFromStringDate = (inputTime, dateTimeFormatter) => {
    const parsedDate = parse(inputTime, dateTimeFormatter, new Date(), { locale: enUS });
    return format(parsedDate, "HH:mm:ss", { locale: enUS });
};

const convertDateToString = (inputDate, formatter = DATE_TIME_FORMATTER) => {
    return format(inputDate, formatter, { locale: enUS });
};

const convertInSpecificFormat = inputDate => {
    const currentDate = new Date();
    const monthDisplay = format(currentDate, "MM", { locale: enUS });
    return `${inputDate}/${monthDisplay}/${currentDate.getFullYear()}`;
};

const convertMonthNYearForOFNEmail = period => {
    if (!period) {return null;}

    const [month, year] = period.split("-");
    const periodDate = parse(`${year}-${month}-01`, APPN_DATE_FORMATTER1, new Date(), { locale: enUS });
    return format(periodDate, "MMM yyyy", { locale: enUS });
};

const convertInToDateFormat = inputDate => {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const month = inputDate < currentDay ? currentDate.getMonth() + 2 : currentDate.getMonth() + 1;
    const monthDisplay = month > 9 ? month : `0${month}`;
    return `${inputDate}/${monthDisplay}/${currentDate.getFullYear()}`;
};

const getCurrentMonth = () => {
    const currentDate = new Date();
    const monthDisplay = format(currentDate, "MM", { locale: enUS });
    return monthDisplay;
};

const convertStringToDate = (inputDate, formatter) => {
    return parse(inputDate, formatter, new Date(), { locale: enUS });
};

const fetchMonthName = monthVal => {
    const month = new Date(0, monthVal - 1).toLocaleString("en-US", { month: "short" });
    return month;
};

const convertToLocalDateTimeViaInstant = dateToConvert => {
    return dateToConvert.toISOString().split("T")[0];
};

const changeDateFormat = (inputDate, targetFormat) => {
    return format(parseISO(inputDate), targetFormat, { locale: enUS });
};

const extractTime = inputTime => {
    const parsedDate = parseISO(inputTime);
    return format(parsedDate, "HH:mm:ss", { locale: enUS });
};

const convertLocalDateToDate = inputDate => {
    return new Date(inputDate);
};

const getDayStringFromDate = (inputDate, locale = enUS) => {
    const date = parseISO(inputDate);
    return format(date, "EEEE", { locale });
};

const fetchDatesFromMonthAndYear = (inputMonth, inputYear) => {
    const startDate = formatDateAsString(new Date(inputYear, inputMonth - 1, 1), "yyyy-MM-dd");
    const endDate = formatDateAsString(
        new Date(inputYear, inputMonth - 1, new Date(inputYear, inputMonth, 0).getDate()),
        "yyyy-MM-dd"
    );
    return [startDate, endDate];
};

const fetchClaimDateFromMonthAndYear = (inputDay, inputMonth, inputYear) => {
    const date = new Date(inputYear, inputMonth - 1, inputDay);
    return [date, date];
};

const getUTCTimeStamp = () => {
    return new Date().toISOString();
};

const compareDates = (startDate, endDate) => {
    if (!startDate || !endDate || isAfter(startDate, endDate)) {
        return "Start Date/End Date is not valid.";
    }
    return null;
};

const checkForDateValidity = (fromDateStr, toDateStr) => {
    let message = null;

    if (fromDateStr && toDateStr) {
        try {
            const fromDate = parse(fromDateStr, APPN_DATE_FORMATTER, new Date(), { locale: enUS });
            const toDate = parse(toDateStr, APPN_DATE_FORMATTER, new Date(), { locale: enUS });

            if (isAfter(fromDate, toDate)) {
                message = "From Date can't be after To Date";
            } else if (isBefore(toDate, fromDate)) {
                message = "To Date can't be before From Date";
            } else if (isSameDay(fromDate, toDate)) {
                message = "From and To Dates can't be the same";
            }
        } catch (e) {
            try {
                const fromDate = parse(fromDateStr, APPN_DATE_FORMATTER1, new Date(), { locale: enUS });
                const toDate = parse(toDateStr, APPN_DATE_FORMATTER1, new Date(), { locale: enUS });

                if (isAfter(fromDate, toDate)) {
                    message = "From Date can't be after To Date";
                } else if (isBefore(toDate, fromDate)) {
                    message = "To Date can't be before From Date";
                } else if (isSameDay(fromDate, toDate)) {
                    message = "From and To Dates can't be the same";
                }
            } catch (ex) {
                message = `Dates are not parsed properly: ${ex.message}`;
            }
        }
    } else {
        message = "Dates are not properly provided";
    }

    return message;
};

const frameLocalDateTime = (year, month, dayOfMonth, hour, minute) => {
    if (hour === 24 && minute === 0) {
        hour = 23;
        minute = 59;
    }
    return new Date(year, month - 1, dayOfMonth, hour, minute);
};

const frameLocalDateTimeFromString = (claimStartDate, time) => {
    if (claimStartDate.includes("-") && time.includes(":")) {
        const [year, month, day] = claimStartDate.split("-").map(Number);
        const [hour, minute] = time.split(":").map(Number);
        return frameLocalDateTime(year, month, day, hour, minute);
    }
    return null;
};

const isNumeric = stringNumeric => {
    return !isNaN(parseFloat(stringNumeric)) && isFinite(stringNumeric);
};

const differenceInCutOffDates = (configCutOff, noOfDays, isBeforeCheck) => {
    if (configCutOff && noOfDays) {
        const cutoffDate = parse(configCutOff, APPN_DATE_FORMATTER, new Date(), { locale: enUS });
        const today = new Date();
        const diff = differenceInDays(startOfDay(today), startOfDay(cutoffDate));

        const daysToCompare = Number(noOfDays);
        if (isBeforeCheck) {
            return diff === daysToCompare;
        } else {
            return diff >= 0 && diff <= daysToCompare;
        }
    }
    return false;
};

const differenceDatesInCurrentMonth = (configCutOff, noOfDays, isBeforeCheck) => {
    if (configCutOff && noOfDays) {
        const cutoffDate = parse(convertInSpecificFormat(configCutOff), APPN_DATE_FORMATTER, new Date(), {
            locale: enUS,
        });
        const today = new Date();
        const diff = differenceInDays(startOfDay(today), startOfDay(cutoffDate));

        const daysToCompare = Number(noOfDays);
        if (isBeforeCheck) {
            return diff === daysToCompare;
        } else {
            return diff >= 0 && diff <= daysToCompare;
        }
    }
    return false;
};

const getCwsBatchEmailDate = (strDate, timeRange) => {
    const calList = [];
    const startCal = new Date();
    const endCal = new Date();

    if (strDate) {
        const date = convertStringToDate(strDate, APPN_DATE_FORMATTER1);
        startCal.setTime(date);
    }

    if (timeRange && timeRange.includes("-")) {
        const [startRange, endRange] = timeRange.split("-").map(Number);

        if (startRange >= endRange) {
            startCal.setDate(startCal.getDate() - 1);
            startCal.setHours(startRange, 0, 0);
            endCal.setHours(endRange - 1, 59, 59);
        } else {
            startCal.setHours(startRange, 0, 0);
            endCal.setHours(endRange - 1, 59, 59);
        }
    } else {
        startCal.setDate(startCal.getDate() - 1);
        startCal.setHours(17, 0, 0);
        endCal.setHours(16, 59, 59);
    }

    calList.push(startCal);
    calList.push(endCal);
    return calList;
};

const fetchQuarterlyDates = inputDate => {
    const date = parse(inputDate, APPN_DATE_FORMATTER, new Date(), { locale: enUS });
    const dayOfMonth = date.getDate();
    const quarter = Math.floor((date.getMonth() + 3) / 3);
    const year = date.getFullYear();

    const firstDay = new Date(year, (quarter - 1) * 3, 1);
    const lastDay = new Date(year, quarter * 3, 0);

    return {
        start: firstDay,
        end: lastDay,
    };
};

const convertOffsetDateToDate = (inputDate, offset) => {
    return addDays(parseISO(inputDate), offset);
};

const getFirstAndLastDateFromOffset = dateOffset => {
    const date = new Date();
    return addDays(date, dateOffset);
};

/*
 * Format Date as String
 */
const formatDateAsString = (dateValue, format, isYearFormat, localData) => {
    var response = "";
    if (dateValue && dateValue !== "NA" && dateValue !== "/Date(0)/") {
        if (dateValue) {
            if (typeof dateValue === "string" && dateValue.indexOf("/Date") > -1) {
                dateValue = parseFloat(
                    dateValue.substr(dateValue.lastIndexOf("(") + 1, dateValue.lastIndexOf(")") - 1)
                );
            }
            dateValue = new Date(dateValue);
        }
        /*else {
                dateValue = new Date();
            }*/
        if (dateValue) {
            var yyyy = dateValue.getFullYear() + "";
            var tempDateStr = new Date().getFullYear();
            if (isYearFormat && isYearFormat != "false" && parseInt(yyyy) < tempDateStr) {
                yyyy = tempDateStr.toString().substring(0, 2) + yyyy.substring(2, yyyy.length);
            }
            var mm = dateValue.getMonth() + 1 + "";
            mm = mm.length > 1 ? mm : "0" + mm;
            var dd = dateValue.getDate() + "";
            dd = dd.length > 1 ? dd : "0" + dd;

            var hh, mins, secs;

            switch (format) {
                case "yyyyMMdd":
                    response = yyyy + mm + dd;
                    break;
                case "dd/MM/yyyy":
                    response = dd + "/" + mm + "/" + yyyy;
                    break;
                case "yyyy-MM-dd":
                    response = yyyy + "-" + mm + "-" + dd;
                    break;
                case "yyyy-dd-MM":
                    response = yyyy + "-" + dd + "-" + mm;
                    break;
                case "MM/dd/yyyy":
                    response = mm + "/" + dd + "/" + yyyy;
                    break;
                case "MM/yyyy":
                    response = mm + "/" + yyyy;
                    break;
                case "yyyy-MM-ddThh:MM:ss":
                    hh = dateValue.getHours() + "";
                    hh = hh.length > 1 ? hh : "0" + hh;
                    mins = dateValue.getMinutes() + "";
                    mins = mins.length > 1 ? mins : "0" + mins;
                    secs = dateValue.getSeconds() + "";
                    secs = secs.length > 1 ? secs : "0" + secs;
                    response = yyyy + "-" + mm + "-" + dd + "T" + hh + ":" + mins + ":" + secs;
                    break;
                case "yyyy-MM-dd hh:MM:ss":
                    hh = dateValue.getHours() + "";
                    hh = hh.length > 1 ? hh : "0" + hh;
                    mins = dateValue.getMinutes() + "";
                    mins = mins.length > 1 ? mins : "0" + mins;
                    secs = dateValue.getSeconds() + "";
                    secs = secs.length > 1 ? secs : "0" + secs;
                    response = yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mins + ":" + secs;
                    break;
                case "hh:MM:ss":
                    hh = dateValue.getHours() + "";
                    hh = hh.length > 1 ? hh : "0" + hh;
                    mins = dateValue.getMinutes() + "";
                    mins = mins.length > 1 ? mins : "0" + mins;
                    secs = dateValue.getSeconds() + "";
                    secs = secs.length > 1 ? secs : "0" + secs;
                    response = hh + ":" + mins + ":" + secs;
                    break;
                case "dd/MM/yyyy hh:MM:ss":
                    response = dd + "/" + mm + "/" + yyyy + " ";
                    hh = dateValue.getHours() + "";
                    hh = hh.length > 1 ? hh : "0" + hh;
                    mins = dateValue.getMinutes() + "";
                    mins = mins.length > 1 ? mins : "0" + mins;
                    secs = dateValue.getSeconds() + "";
                    secs = secs.length > 1 ? secs : "0" + secs;
                    response += hh + ":" + mins + ":" + secs;
                    break;
                case "dd/MM/yyyy hh:MM:ss aa":
                    response = mm + "/" + dd + "/" + yyyy + " ";
                    hh = dateValue.getHours();
                    var ampm = hh >= 12 ? "PM" : "AM";
                    hh = hh % 12;
                    hh = hh ? (hh < 10 ? "0" + hh : hh) : 12;
                    // hh = (hh.length > 1) ? hh : "0" + hh;
                    mins = dateValue.getMinutes() + "";
                    mins = mins.length > 1 ? mins : "0" + mins;
                    secs = dateValue.getSeconds() + "";
                    secs = secs.length > 1 ? secs : "0" + secs;
                    response += hh + ":" + mins + ":" + secs + " " + ampm;
                    break;
                case "dd Mmm,yyyy":
                    response = mm + "/" + dd + "/" + yyyy + " ";
                    mm = localData[Number(mm) - 1].substring(0, 3);
                    hh = dateValue.getHours();
                    var ampm = hh >= 12 ? "PM" : "AM";
                    hh = hh % 12;
                    hh = hh ? (hh < 10 ? "0" + hh : hh) : 12;
                    // hh = (hh.length > 1) ? hh : "0" + hh;
                    mins = dateValue.getMinutes() + "";
                    mins = mins.length > 1 ? mins : "0" + mins;
                    secs = dateValue.getSeconds() + "";
                    secs = secs.length > 1 ? secs : "0" + secs;
                    response = dd + " " + mm + "," + yyyy;
                    break;
                case "dd Mmm, yyyy":
                    response = mm + "/" + dd + "/" + yyyy + " ";
                    mm = localData[Number(mm) - 1].substring(0, 3);
                    hh = dateValue.getHours();
                    var ampm = hh >= 12 ? "PM" : "AM";
                    hh = hh % 12;
                    hh = hh ? (hh < 10 ? "0" + hh : hh) : 12;
                    // hh = (hh.length > 1) ? hh : "0" + hh;
                    mins = dateValue.getMinutes() + "";
                    mins = mins.length > 1 ? mins : "0" + mins;
                    secs = dateValue.getSeconds() + "";
                    secs = secs.length > 1 ? secs : "0" + secs;
                    response = dd + " " + mm + ", " + yyyy;
                    break;
                default:
                    response = dateValue;
                    break;
            }
        }
    }
    return response;
    //Format Year
};

module.exports = {
    convertForMassUploadFormat,
    extractTimeFromStringDate,
    convertDateToString,
    convertInSpecificFormat,
    convertMonthNYearForOFNEmail,
    convertInToDateFormat,
    getCurrentMonth,
    convertStringToDate,
    fetchMonthName,
    convertToLocalDateTimeViaInstant,
    changeDateFormat,
    extractTime,
    convertLocalDateToDate,
    getDayStringFromDate,
    fetchDatesFromMonthAndYear,
    fetchClaimDateFromMonthAndYear,
    getUTCTimeStamp,
    checkForDateValidity,
    compareDates,
    frameLocalDateTime,
    frameLocalDateTimeFromString,
    isNumeric,
    differenceInCutOffDates,
    differenceDatesInCurrentMonth,
    getCwsBatchEmailDate,
    fetchQuarterlyDates,
    convertOffsetDateToDate,
    getFirstAndLastDateFromOffset,
    formatDateAsString,
};
