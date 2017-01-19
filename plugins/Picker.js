const Guppy = require('../libs/Guppy');
const {
    domOpt
} = Guppy.utils;
const draggable = require("../libs/draggable");
const translateUtil = require('../libs/translate');
var itemHandlbars = handlebarsRuntime.template(require("../build/hbs/item"));
var pickerHandlbars = handlebarsRuntime.template(require("../build/hbs/picker"));
const ITEM_HEIGHT = 36;
const visibleItemCount = 5;

const startHeight = (visibleItemCount - 1) / 2 * ITEM_HEIGHT;

function translate2index(translate) {
    translate = Math.round(translate / ITEM_HEIGHT) * ITEM_HEIGHT;
    var index = -(translate - Math.floor(visibleItemCount / 2) * ITEM_HEIGHT) / ITEM_HEIGHT;

    return index;
}



var Picker = Guppy.extend({

    defaultOptions: {
        mount: function(el) {
            var self = this;
            el.innerHTML = pickerHandlbars();
            var hookEl = el.querySelector(".picker-items");
            for (var i=0,_slots = this.get("slots");i<_slots.length;i++) {
                var value = _slots[i];
                let tmpEl = document.createElement("div");
                tmpEl.className="picker-slot";
                tmpEl.innerHTML = itemHandlbars({
                    items: this.get(value)
                });
                hookEl.appendChild(tmpEl);
                (function(el, rangeKey, valueKey) {
                    self.on("change:" + rangeKey, function() {
                        el.className="picker-slot";
                        el.innerHTML = itemHandlbars({
                            items: self.get(rangeKey)
                        });
                        wrapperEl = el.querySelector(".picker-slot-wrapper");
                        bindDraggableEvents();
                    });
                    var wrapperEl = el.querySelector(".picker-slot-wrapper");

                    function setValue() {
                        var index = self.get(valueKey);
                        var translate = startHeight - (index * ITEM_HEIGHT);
                        wrapperEl.style.height = visibleItemCount * ITEM_HEIGHT + "px";
                        translateUtil.translateElement(wrapperEl, null, translate);
                        var items = wrapperEl.querySelectorAll(".picker-item");
                        if (items.length === 0) {
                            return;
                        }
                        var selectItem = wrapperEl.querySelector(".picker-selected");
                        if (selectItem) {
                            domOpt.removeClass(selectItem, "picker-selected");
                        }
                        domOpt.addClass(items[index], "picker-selected");
                    }
                    setValue();
                    self.on("change:" + valueKey, setValue);
                    translateUtil.translateElement(wrapperEl, null, startHeight);
                    var dragState = {};
                    var velocityTranslate, prevTranslate;
                    bindDraggableEvents();
                    function bindDraggableEvents(){
                        draggable(wrapperEl, {
                            start: (event) => {
                                dragState = {
                                    start: new Date(),
                                    startLeft: event.pageX,
                                    startTop: event.pageY,
                                    startTranslateTop: translateUtil.getElementTranslate(wrapperEl).top
                                };
                                domOpt.addClass(wrapperEl,"dragging");

                            },
                            drag: (event) => {
                                dragState.left = event.pageX;
                                dragState.top = event.pageY;
                                var deltaY = dragState.top - dragState.startTop;
                                var translate = dragState.startTranslateTop + deltaY;
                                translateUtil.translateElement(wrapperEl, null, translate);
                                velocityTranslate = translate - prevTranslate || translate;
                                prevTranslate = translate;
                            },
                            end: () => {
                                domOpt.removeClass(wrapperEl,"dragging");
                                var momentumRatio = 7;
                                var currentTranslate = translateUtil.getElementTranslate(wrapperEl).top;
                                var duration = new Date() - dragState.start;

                                var momentumTranslate;
                                if (duration < 300) {
                                    momentumTranslate = currentTranslate + velocityTranslate * momentumRatio;
                                }

                                var translate;
                                if (momentumTranslate) {
                                    translate = Math.round(momentumTranslate / ITEM_HEIGHT) * ITEM_HEIGHT;
                                } else {
                                    translate = Math.round(currentTranslate / ITEM_HEIGHT) * ITEM_HEIGHT;
                                }
                                var items = wrapperEl.querySelectorAll(".picker-item");
                                translate = Math.max((items.length - 1) * -1 * ITEM_HEIGHT + startHeight, Math.min(translate, startHeight));
                                var index = translate2index(translate);
                                self.set(valueKey, index);
                                dragState = {};
                            }
                        });
                    }
                })(tmpEl, value, value + "Value");
            }
        }.$on("mount")
    }
});



module.exports = Picker;
