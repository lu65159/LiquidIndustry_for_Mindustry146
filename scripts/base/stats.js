
const DAMAGE = 2000;
const 合金装甲储液罐 = extend(LiquidRouter, "合金装甲储液罐", {
    setStats(){
        this.super$setStats();
        this.stats.add(Stat.lightningDamage, DAMAGE, StatUnit.none);
    }
})

const 大型合金装甲储液罐 = extend(LiquidRouter, "大型合金装甲储液罐", {
    setStats(){
        this.super$setStats();
        this.stats.add(Stat.lightningDamage, DAMAGE, StatUnit.none);
    },
})

const 微型核心基座 = extend(CoreBlock, "微型核心基座", {
	canBreak(tile) {
		return Vars.state.teams.cores(tile.team()).size > 1;
	},
	canReplace(other) {
		return other.alwaysReplace;
	},
	canPlaceOn(tile, team, rotation) {
		return Vars.state.teams.cores(team).size < 4;
	}
});
