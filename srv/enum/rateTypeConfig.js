const RateTypeConfig = {
    HOURLY: {
        value: "10",
        getValue() {
            return this.value;
        },
    },
    MONTHLY: {
        value: "11",
        getValue() {
            return this.value;
        },
    },
    PER_STUDENT: {
        value: "12",
        getValue() {
            return this.value;
        },
    },
    PER_SCRIPT: {
        value: "14",
        getValue() {
            return this.value;
        },
    },
    OTHERS: {
        value: "16",
        getValue() {
            return this.value;
        },
    }, // Alias for HOURLY_A007 below
    HOURLY_A007: {
        value: "16",
        getValue() {
            return this.value;
        },
    },
    T_LEARNING_INCENTIVE_2HOURS: {
        value: "20",
        getValue() {
            return this.value;
        },
    },
    T_LEARNING_INCENTIVE: {
        value: "21",
        getValue() {
            return this.value;
        },
    },
    UNKNOWN: {
        value: "unknown",
        getValue() {
            return this.value;
        },
    },

    /**
     * Returns the RateTypeConfig object for a given value.
     * Returns UNKNOWN if not found.
     * @param value
     */
    fromValue: function (value) {
        value = value == null ? "" : value;
        for (const key in this) {
            // Only check own properties with a 'value' attribute
            if (
                this.hasOwnProperty(key) &&
                typeof this[key] === "object" &&
                "value" in this[key] &&
                this[key].value === value
            ) {
                return this[key];
            }
        }
        return this.UNKNOWN;
    },
};

module.exports = RateTypeConfig;
