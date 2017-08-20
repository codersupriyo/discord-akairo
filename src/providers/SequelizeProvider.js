const Provider = require('./Provider');

/** @extends Provider */
class SequelizeProvider extends Provider {
    /**
     * Provider using the `sequelize` library.
     * @param {Model} table - A Sequelize model.
     * @param {ProviderOptions} [options={}] - Options to use.
     */
    constructor(table, options = {}) {
        super();

        /**
         * Sequelize model.
         * @type {Model}
         */
        this.table = table;

        /**
         * Column for ID.
         * @type {string}
         */
        this.idColumn = options.idColumn || 'id';

        /**
         * Column for JSON data.
         * @type {?string}
         */
        this.dataColumn = options.dataColumn;
    }

    /**
     * Initializes the provider.
     * @returns {Bluebird<void>}
     */
    init() {
        return this.table.findAll().then(rows => {
            for (const row of rows) {
                this.items.set(row[this.idColumn], this.dataColumn ? row[this.dataColumn] : row);
            }
        });
    }

    /**
     * Gets a value.
     * @param {string} id - ID of entry.
     * @param {string} key - The key to get.
     * @param {any} [defaultValue] - Default value if not found or null.
     * @returns {any}
     */
    get(id, key, defaultValue) {
        if (this.items.has(id)) {
            const value = this.items.get(id)[key];
            return value == null ? defaultValue : value;
        }

        return defaultValue;
    }

    /**
     * Sets a value.
     * @param {string} id - ID of entry.
     * @param {string} key - The key to set.
     * @param {any} value - The value.
     * @returns {Bluebird<boolean>}
     */
    set(id, key, value) {
        const data = this.items.get(id) || {};
        data[key] = value;
        this.items.set(id, data);

        if (this.dataColumn) {
            return this.table.upsert({
                [this.idColumn]: id,
                [this.dataColumn]: data
            });
        }

        return this.table.upsert({
            [this.idColumn]: id,
            [key]: value
        });
    }

    /**
     * Deletes a value.
     * @param {string} id - ID of entry.
     * @param {string} key - The key to delete.
     * @returns {Promise<boolean>}
     */
    delete(id, key) {
        const data = this.items.get(id) || {};
        delete data[key];

        if (this.dataColumn) {
            return this.table.upsert({
                [this.idColumn]: id,
                [this.dataColumn]: data
            });
        }

        return this.table.upsert({
            [this.idColumn]: id,
            [key]: null
        });
    }

    /**
     * Clears an entry.
     * @param {string} id - ID of entry.
     * @returns {Bluebird<void>}
     */
    clear(id) {
        this.items.delete(id);
        return this.table.destroy({ where: { [this.idColumn]: id } });
    }
}

module.exports = SequelizeProvider;
