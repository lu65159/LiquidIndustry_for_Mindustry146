const lib = require("base/lib");
const jh = new ParticleWeather("极寒");
const NT = new Planet("Nepture", Planets.sun, 1.2, 2.5);
NT.description = "温度极低，常年暴雪，地表矿物稀缺，存在大量未被开发的液体资源。";
NT.meshLoader = prov(() => new MultiMesh(
	new HexMesh(NT, 5),
	new HexSkyMesh(NT, 2, 0.15, 0.05, 5, Color.valueOf("D8F3FF50"), 2, 0.42, 1, 0.43),
));
NT.generator = extend(SerpuloPlanetGenerator, {
	getDefaultLoadout() {
		return Schematics.readBase64("bXNjaAF4nA3JMQ6AIBAAwQXFRr9i4XuMBR5XkCAYkP9LphwcbmLO/lHMwRq0SY3vF0sGluRvTQ17XoZNStU9d0na20gDduAHAc0Org==")
	}
});
NT.cloudMeshLoader = prov(() => new MultiMesh(
	new HexSkyMesh(NT, 2, 0.15, 0.05, 5, Color.valueOf("D8F3FF80"), 2, 0.42, 1, 0.43),
	new HexSkyMesh(NT, 3, 0.6, 0.15, 5, Color.valueOf("D8F3FF"), 2, 0.42, 1.2, 0.45),
	//new SunMesh(NT, 4, 3, 0.45, 1.1, 2.2, 0.45, 0.35, Color.valueOf("4A90E230"), Color.valueOf("87CEEB30"), Color.valueOf("B0E0E630"))
));
NT.landCloudColor = Color.valueOf("D8F3FF");
NT.visible = true;
NT.accessible = true;
NT.alwaysUnlocked = true;
NT.allowSectorInvasion = false;
//NT.allowLaunchToNumbered = false;
NT.clearSectorOnLose = true;
NT.tidalLock = false;
NT.localizedName = "尼普顿";
NT.prebuildBase = false;
NT.bloom = false;
NT.startSector = 1;
NT.orbitRadius = 90;
NT.orbitTime = 360 * 60;
NT.rotateTime = 10 * 60;
NT.atmosphereRadIn = 0.02;
NT.atmosphereRadOut = 0.3;
NT.atmosphereColor = NT.lightColor = Color.valueOf("D8F3FF");
NT.iconColor = Color.valueOf("D8F3FF");
NT.hiddenItems.addAll(Items.erekirItems).removeAll(Items.serpuloItems);
NT.ruleSetter = (r) => {
	r.weather = Seq.with(
        new Weather.WeatherEntry(
            jh,
            60 * 5,    // fMin
            60 * 30,   // fMax
            60 * 60,   // durationMin
            60 * 300,  // durationMax
        ),
    );
};


exports.NT = NT;
exports.Nepture = NT;

/////////////////////////////////////////地图
const map1cs = new SectorPreset("测试区", NT, 1);
map1cs.description = "第一个测试地图！";
map1cs.difficulty = 1;
map1cs.noLighting = true;
map1cs.alwaysUnlocked = false;
map1cs.addStartingItems = true;
map1cs.captureWave = 2;
map1cs.localizedName = "测试区";
lib.addToResearch(map1cs, {
	parent: "planetaryTerminal",
	objectives: Seq.with(new Objectives.SectorComplete(SectorPresets.planetaryTerminal))
})
exports.map1cs = map1cs;


const map2xc = new SectorPreset("狭长冰谷", NT, 38);
map2xc.description = "不见天日的寒冷峡谷，矿物稀缺，在此开始探索星球上液体资源的利用方式。\n不要因为前期看似充足的时间而放松警惕。";
map2xc.difficulty = 8;
map2xc.noLighting = true;
map2xc.alwaysUnlocked = false;
map2xc.addStartingItems = true;
map2xc.captureWave = 55;
map2xc.localizedName = "狭长冰谷";
lib.addToResearch(map2xc, {
	parent: "测试区",
	objectives: Seq.with(new Objectives.SectorComplete(map1cs))
})
exports.map2xc = map2xc;


const map3jb = new SectorPreset("极冰溶洞", NT, 56);
map3jb.description = "寒冷液体侵蚀形成的巨大溶洞，暗无天日，敌人盘踞于此，其防空力量异常强大。\n回收附近遗留的废墟，进一步研究液体资源利用方式。尽快使用两栖兵种摧毁所有敌方核心。";
map3jb.difficulty = 14;
map3jb.noLighting = false;
map3jb.alwaysUnlocked = false;
map3jb.addStartingItems = true;
map3jb.captureWave = 0;
map3jb.localizedName = "极冰溶洞";
lib.addToResearch(map3jb, {
	parent: "狭长冰谷",
	objectives: Seq.with(new Objectives.SectorComplete(map2xc))
})
exports.map3jb = map3jb;
