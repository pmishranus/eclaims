/**
 * Simple performance monitoring utility
 * Can be easily integrated into functions for performance tracking
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }

    /**
     * Start timing an operation
     * @param {string} operationName - Name of the operation to monitor
     * @returns {string} Timer ID for stopping the timer
     */
    startTimer(operationName) {
        const timerId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.metrics.set(timerId, {
            operationName,
            startTime: Date.now(),
            endTime: null,
            duration: null
        });
        return timerId;
    }

    /**
     * Stop timing an operation
     * @param {string} timerId - Timer ID returned from startTimer
     * @returns {object} Performance metrics
     */
    stopTimer(timerId) {
        const metric = this.metrics.get(timerId);
        if (!metric) {
            console.warn(`Timer ${timerId} not found`);
            return null;
        }

        metric.endTime = Date.now();
        metric.duration = metric.endTime - metric.startTime;

        // Log performance metrics
        this.logPerformance(metric);

        // Clean up
        this.metrics.delete(timerId);

        return metric;
    }

    /**
     * Log performance metrics
     * @param {object} metric - Performance metric object
     */
    logPerformance(metric) {
        const { operationName, duration } = metric;
        
        console.log(`${operationName} completed in ${duration}ms`);
        
        // Warn for slow operations
        if (duration > 1000) {
            console.warn(`⚠️  Slow operation detected: ${operationName} took ${duration}ms`);
        }
        
        // Error for very slow operations
        if (duration > 5000) {
            console.error(`🚨 Very slow operation: ${operationName} took ${duration}ms`);
        }
    }

    /**
     * Monitor a function execution
     * @param {string} operationName - Name of the operation
     * @param {Function} fn - Function to monitor
     * @returns {Promise<any>} Result of the function
     */
    async monitor(operationName, fn) {
        const timerId = this.startTimer(operationName);
        
        try {
            const result = await fn();
            this.stopTimer(timerId);
            return result;
        } catch (error) {
            this.stopTimer(timerId);
            throw error;
        }
    }

    /**
     * Get performance statistics
     * @returns {object} Performance statistics
     */
    getStats() {
        const stats = {
            totalOperations: this.metrics.size,
            activeTimers: Array.from(this.metrics.keys())
        };
        return stats;
    }

    /**
     * Clear all metrics
     */
    clear() {
        this.metrics.clear();
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Convenience functions for easy integration
const monitor = {
    /**
     * Start timing an operation
     * @param {string} operationName - Name of the operation
     * @returns {string} Timer ID
     */
    start: (operationName) => performanceMonitor.startTimer(operationName),
    
    /**
     * Stop timing an operation
     * @param {string} timerId - Timer ID
     * @returns {object} Performance metrics
     */
    stop: (timerId) => performanceMonitor.stopTimer(timerId),
    
    /**
     * Monitor a function execution
     * @param {string} operationName - Name of the operation
     * @param {Function} fn - Function to monitor
     * @returns {Promise<any>} Result of the function
     */
    async: (operationName, fn) => performanceMonitor.monitor(operationName, fn),
    
    /**
     * Get performance statistics
     * @returns {object} Performance statistics
     */
    stats: () => performanceMonitor.getStats()
};

module.exports = {
    PerformanceMonitor,
    monitor
}; 