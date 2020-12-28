const stringSimilarity = require('string-similarity');
/**
 * Available options to modify the specification of semantic-query.
 * @typedef {object} plugins
 * @property {boolean} [dev=false] - Toggle true to log the process during query analyze.
 * @property {float} [acceptableThreshold=0.8] - Minimum confidence rate.
 */
class SemanticQuery {
  /**
     * A tiny, simplified query processor. Built on top of @aceakash/string-similarity.
     * @param {plugins} plugins - Available options to modify the specification of semantic-query.
     * @author klerikdust <nightcore.raven07@gmail.com>
     * @version 0.1.0
     * @constructor
     */
  constructor(plugins = {}) {
    /**
         * Dev-mode toggle.
         * @type {boolean}
         */
    this.isDevMode = plugins.dev || false;

    /**
         * Confidence rate on classifying.
         * @type {number|float}
         */
    this.acceptableThreshold = plugins.acceptableThreshold || 0.8;

    /**
         * The query in current instance
         * @type {string}
         */
    this.activeQuery = '';

    /**
         * Set of registered labels
         * @type {map}
         */
    this.activeClassifications = new Map();

    /**
         * Class ID
         * @type {string}
         */
    this.classId = 'semantic-query';
  }

  /**
     * Register a new query to be analyzed.
     * @version 0.1.0
     * @param {string} query - A query to be processed.
     * @return {object}
     */
  analyze(query = '') {
    //  Handle invalid query
    if ((typeof query !== 'string') || (query.length <= 0)) {
      throw new TypeError(`[${this.classId}][.add] parameter 'query' cannot be non-string or has zero length.`);
    }
    this.query = query;
    this._devLogging(`[.analyze] Added a new parameter: '${query}'`);
    const res = this.analysisStructure();
    //  Handle if classifications aren't provided
    if (!this.activeClassifications.size) {
      this._devLogging('There are no registered classifications and now it will return the default structure');
      return res;
    }
    res.query = query;
    res.tokens = query.split(' ');
    //  Iterate token-level
    for (let i = 0; i < res.tokens.length; i++) {
      const token = res.tokens[i];
      //  Iterate classifications-level
      for (const [label, samples] of this.activeClassifications) {
        const { bestMatch } = stringSimilarity.findBestMatch(token, samples);
        if (bestMatch.rating >= this.acceptableThreshold) {
          this._devLogging(`[.analyze] Successfully classified '${token}' as '${label}' with confidence rate: ${bestMatch.rating * 100}%`);
          let registeredTokens = [];
          //  Handle if there are registered tokens
          if (res.results.has(label)) {
            registeredTokens = res.results.get(label);
          }
          registeredTokens.push(token);
          res.results.set(label, registeredTokens);
        }
      }
    }
    return res;
  }

  /**
     * Adds a new label
     * @param {strng} [labelName=``] - A label for this category of words.
     * @param {array|string} [sample] - Collection of samples to be used as word references.
     * @return {this}
     */
  classify(labelName = '', sample = []) {
    //  Handle invalid label
    if ((typeof labelName !== 'string') || (labelName.length <= 0)) {
      throw new TypeError(`[${this.classId}][.classify] parameter 'labelName' cannot be non-string or has zero length.`);
    }
    this.activeClassifications.set(labelName, sample);
    this._devLogging(`[.classify] successfully registering '${labelName}' with ${sample.length} samples`);
    return this;
  }

  /**
     * Log internal process.
     * @param {string} msg - Process to be displayed in the log
     * @private
     * @return {void}
     */
  _devLogging(msg = '') {
    if (this.isDevMode) console.debug(`[${this.classId}] ${msg}`);
  }

  /**
     * Default template for the query structure
     * @type {object}
     */
  static analysisStructure() {
    return {
      timestamp: new Date(),
      query: '',
      tokens: [],
      results: new Map(),
    };
  }

  /**
     * Updating current active query
     * @param {string} query
     */
  set query(query = '') {
    this.activeQuery = query;
  }
}

module.exports = SemanticQuery;
