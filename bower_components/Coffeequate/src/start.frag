/**
 * Coffeequate v1.2.2
 * http://matthewja.com/Coffeequate
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module
        //in another project. That other project will only
        //see this AMD call, not the internal modules in
        //the closure below.
        define(factory);
    } else if (typeof module == 'object' && typeof module.exports == 'object') {
        module.exports = factory();
    } else {
        //Browser globals case. Just assign the
        //result to a property on the global.
        root.libGlobalName = factory();
        window.coffeequate = window.CQ = factory();
    }
}(this, function () {
    //almond, and modules will be inlined here
