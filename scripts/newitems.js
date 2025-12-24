function newItem(name) {
    exports[name] = (() => {
        let myItem = extend(Item, name, {});
        return myItem;
    })();
}
newItem("亲水质")
newItem("治愈质")
newItem("超导质")
newItem("固态水")
newItem("固态重水")
newItem("固态冷冻液")
newItem("固态石油")
newItem("固态超级冷冻液")
