function newLiquid(name) {
	exports[name] = (() => {
		let myLiquid = extend(Liquid, name, {});
		return myLiquid;
	})();
}
newLiquid("重水")
newLiquid("冰冷废液")
newLiquid("一级精炼废液")
newLiquid("二级精炼废液")
newLiquid("超级冷冻液")
