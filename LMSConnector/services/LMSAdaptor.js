/**
 * Abstract Class LMSAdaptor
 * Defines the interface for LMS connections and data preparation.
 */
class LMSAdaptor {
    constructor() {
        if (this.constructor === LMSAdaptor) {
            throw new Error("Abstract class 'LMSAdaptor' cannot be instantiated directly.");
        }
    }

    /**
     * Connects to the LMS source.
     * @returns {Promise<boolean>}
     */
    async connect() {
        throw new Error("Method 'connect()' must be implemented.");
    }

    /**
     * Triggers the data preparation process (e.g., ETL).
     * @returns {Promise<any>}
     */
    async prepareData() {
        throw new Error("Method 'prepareData()' must be implemented.");
    }

    /**
     * Fetches data after preparation.
     * @returns {Promise<any>}
     */
    async fetchData() {
        throw new Error("Method 'fetchData()' must be implemented.");
    }
}

module.exports = LMSAdaptor;
