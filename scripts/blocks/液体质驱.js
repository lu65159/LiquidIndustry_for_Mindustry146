/*
* @author Space
* @version 1.0
* 尚有一些小问题
*/

const RANGE = 90;
const ROTATESPEED = 4;
const RELOADTIME = 240;
const MINTAMOUNT = 800; //最小传输量
const LC=4800; //液体容量
const KNOCKBACK = 0.02;

var Region, baseRegion, liquidRegion;
const 液体质驱 = extend(LiquidBridge, "液体质驱", {

    shootSound: Sounds.shootBig,

    load() {
        this.super$load();
        Region = Core.atlas.find(this.name);
        baseRegion = Core.atlas.find(this.name + "-base");
        liquidRegion = Core.atlas.find(this.name + "-liquid");
    },
    setStats(){
        this.super$setStats();
        this.stats.add(Stat.range, RANGE, StatUnit.blocks);
        this.stats.add(Stat.reload, 60 / RELOADTIME, StatUnit.perSecond);
    },
    drawPlace(x, y, rotation, valid){
        Drawf.dashCircle(x * Vars.tilesize, y * Vars.tilesize, RANGE * Vars.tilesize, Pal.accent);
    },
    drawPlanRegion(plan, list){
        Draw.rect(baseRegion, plan.drawx(), plan.drawy());
        Draw.rect(liquidRegion, plan.drawx(), plan.drawy());
        Draw.rect(this.region,plan.drawx(), plan.drawy());
        //Drawf.dashCircle(plan.drawx(), plan.drawy(), RANGE, Pal.accent);
        this.drawPlanConfig(plan, list);

        if(!Vars.control.input.config.isShown()) return;
        var selected = Vars.control.input.config.getSelected();
        if(selected == null || selected.block != this || !selected.within(plan.drawx(), plan.drawy(), RANGE * Vars.tilesize)) return;
        
        var sin = Mathf.absin(Time.time, 6, 1);
        var tmpVec = new Vec2();
        tmpVec.set(plan.drawx() + this.offset, plan.drawy() + this.offset)
            .sub(selected.x, selected.y)
            .limit((this.size / 2 + 1) * Vars.tilesize + sin + 0.5);
        
        var x2 = plan.drawx() - tmpVec.x;
        var y2 = plan.drawy() - tmpVec.y;
        var x1 = selected.x + tmpVec.x;
        var y1 = selected.y + tmpVec.y;
        var segs = Math.floor(selected.dst(plan.drawx(), plan.drawy()) / Vars.tilesize);
        
        Lines.stroke(4, Pal.gray);
        Lines.dashLine(x1, y1, x2, y2, segs);
        Lines.stroke(2, Pal.placing);
        Lines.dashLine(x1, y1, x2, y2, segs);
        Draw.reset();
    },
    linkValid(tile, other, checkDouble){
        if(other == null || tile == null || other == tile) return false;
        if(!tile.within(other, RANGE * Vars.tilesize)) return false;
        //if(!(other.block() == tile.block() && tile.block() == this))return false;
        return ((other.block() == tile.block() && tile.block() == this) || (!(tile.block() instanceof ItemBridge) && other.block() == this))
            && (other.team == tile.team || tile.block() != this)
            && (!checkDouble || other.build.link != tile.pos());
    },
    icons(){
        return [baseRegion, liquidRegion, this.region];
    }
});

Object.assign(液体质驱, {
    group: BlockGroup.liquids,
    update: true,
    solid: true,
    sync: true,
    hasPower: true,
    hasLiquids: true,
    configurable: true,
    saveConfig: true,
    liquidCapacity: LC,
    noUpdateDisabled: true,
    envDisabled: Env.none,
    clearOnDoubleTap: true,
    canOverdrive: false,
    priority: TargetPriority.transport,
    category: Category.liquid
});

液体质驱.buildType = prov(() => {
    return new JavaAdapter(LiquidBridge.LiquidBridgeBuild, {
        created(){
            this.super$created();
            this.rotation = 90; // 初始化旋转角度90度
            this.startTime = Time.time;
            this.link = -1;
            this.shooterpos = -1;
        },
        getTime(){
            return this.startTime;
        },
        getShooter(){
            if(this.shooterpos == -1) return -1;
            var shooter = Vars.world.build(this.shooterpos);
            return shooter;
        },
        setShooter(shooter){
            var pos;
            if(shooter == -1 || shooter == null || shooter.block != this.block){pos = -1;}
            else{pos = shooter.pos();}
            this.shooterpos = pos;
        },
        acceptLiquid(source, liquid){
            if(this.team != source.team || !this.block.hasLiquids) return false;
            var other = Vars.world.tile(this.link);
            return other != null && this.block.linkValid(this.tile, other) && this.liquids.currentAmount() < LC;
        },
        checkDump(to){
            return true;
        },
        isShooting(shooter, target){ //target接受液体方
            if(shooter == null || target == null) return false;
            if(shooter.power.status == 0) return false;
            if(Math.abs(target.rotation - shooter.rotation) != 180)return false;
            if(Math.min(shooter.liquids.currentAmount(), LC - target.liquids.currentAmount()) < MINTAMOUNT)return false;
            return true;
        },
        updateTile(){
            const other = Vars.world.build(this.link);

            if(other != null){
                if(!this.block.linkValid(this.tile, other.tile)){
                    this.link = -1;
                    if(other.block == this.block)other.setShooter(-1);
                    //this.dumpLiquid(this.liquids.current());
                    //return;
                }else{                          
                    if(this.isShooting(this, other)){     
                        if(this.startTime != 0 && this.reloadState()){
                            var amount = Math.min(LC, this.liquids.currentAmount(), LC - other.liquids.currentAmount());                
                            other.liquids.add(this.liquids.current(), amount);
                            this.liquids.remove(this.liquids.current(), amount);  
                            液体质驱.shootSound.at(this.tile, Mathf.random(0.9, 1.1));
                            this.startTime = Time.time;       
                        }
                    }           
                }                    
            }

            
            this.super$updateTile();
        },
        drawRecoil(){
            var ktime = Math.max(RELOADTIME - Time.time + this.startTime, 0);
            var recoilOffsetX = Angles.trnsx(this.rotation + 180, ktime * KNOCKBACK);
            var recoilOffsetY = Angles.trnsy(this.rotation + 180, ktime * KNOCKBACK);
            if(this.liquids.currentAmount() > 0.2){
                var alpha = this.liquids.currentAmount() / LC * 255;
                Draw.color(this.liquids.current().color);
                Draw.alpha(alpha);
                Draw.rect(liquidRegion, this.x + recoilOffsetX, this.y + recoilOffsetY, this.rotation - 90);
                Draw.alpha(255);
                Draw.color();  
            }
            else{
                Draw.rect(liquidRegion, this.x + recoilOffsetX, this.y + recoilOffsetY, this.rotation - 90);
            }
            Draw.rect(Region, this.x + recoilOffsetX, this.y + recoilOffsetY, this.rotation - 90);

        },
        drawNormal(){
            if(this.liquids.currentAmount() > 0.2){
                var alpha = this.liquids.currentAmount() / LC * 255;
                Draw.color(this.liquids.current().color);
                Draw.alpha(alpha);
                Draw.rect(liquidRegion, this.x, this.y, this.rotation - 90);
                Draw.alpha(255);
                Draw.color();
            }
            else{
                Draw.rect(liquidRegion, this.x, this.y, this.rotation - 90);
            }
            Draw.rect(Region, this.x, this.y, this.rotation - 90);
        },
        draw(){
            Draw.rect(baseRegion, this.x, this.y);       
            Draw.z(Layer.turret);

            var targetAngle;
            if(this.link != -1 && Vars.world.build(this.link) != null && this.power.status != 0){
                targetAngle = this.angleTo(Vars.world.build(this.link));
                this.rotation = Angles.moveToward(this.rotation, targetAngle, ROTATESPEED * this.power.status); 
                
                if(this.isShooting(this, Vars.world.build(this.link))){
                    this.drawRecoil();
                    //////射击连接线/////////////////////
                    var other = Vars.world.build(this.link);
                    var fin = Math.max(0, Mathf.clamp((Time.time - this.startTime) / RELOADTIME * this.power.status) - 0.3); // 动画进度
                    var len = 10;
                    var w = 4 + 5 * (1 - fin);
                    var right = Angles.trnsx(this.rotation, len, w);
                    var left = Angles.trnsx(this.rotation, len, -w);
                    var currentColor;
                    if(this.liquids.currentAmount() > 0.2){currentColor = this.liquids.current().color;}
                    else{currentColor = new Color(194/255, 194/255, 209/255);}
                    Draw.color(currentColor);
                    Lines.stroke(fin * 2);
                    Lines.line(this.x + left, this.y + Angles.trnsy(this.rotation, len, -w), 
                    other.x - right, other.y - Angles.trnsy(this.rotation, len, w));
                    Lines.line(this.x + right, this.y + Angles.trnsy(this.rotation, len, w), 
                    other.x - left, other.y - Angles.trnsy(this.rotation, len, -w));         
                    //箭头动画
                    if((Time.time - this.startTime) < RELOADTIME){
                        var arrowProgress = Mathf.clamp((Time.time - this.startTime) / RELOADTIME);
                        var distance = this.dst(other);
                        var arrowCount = Math.max(3, Math.floor(distance / 25));
                        var arrowSpacing = distance / (arrowCount + 1);
                        var arrowRotation = this.angleTo(other);
                        var activeArrowCount = Math.floor(arrowCount * arrowProgress);
            
                        Draw.color(currentColor);
                        for(var i = 1; i <= arrowCount; i++){
                            var arrowPosition = i * arrowSpacing / distance;
                            var arrowX = this.x + (other.x - this.x) * arrowPosition;
                            var arrowY = this.y + (other.y - this.y) * arrowPosition;
                            // 根据进度决定箭头是否激活
                            if(i <= activeArrowCount){
                                // 激活的箭头：明亮且脉动
                                Draw.alpha(0.9);
                                var pulse = 1 + Mathf.sin(Time.time * 12) * 0.2;
                                Drawf.tri(arrowX, arrowY, 8 * pulse, 5 * pulse, arrowRotation);
                            } else {
                                // 未激活的箭头：暗淡且静止
                                Draw.alpha(0.3);
                                Drawf.tri(arrowX, arrowY, 6, 3.75, arrowRotation);
                            }
                        }
                    }
                    ///////////////////////////////////////////////
                }
                else{
                    this.drawNormal();
                }
            }
            else if(this.getShooter() != -1 && this.power.status != 0){
                var target = this.getShooter();
                targetAngle = this.angleTo(target);
                this.rotation = Angles.moveToward(this.rotation, targetAngle, ROTATESPEED * this.power.status);

                if(target.isShooting(target, this)){
                    var ktime = Math.max(RELOADTIME - Time.time + target.getTime(), 0);
                    var recoilOffsetX = Angles.trnsx(this.rotation + 180, ktime * KNOCKBACK);
                    var recoilOffsetY = Angles.trnsy(this.rotation + 180, ktime * KNOCKBACK);
                    if(this.liquids.currentAmount() > 0.2){
                        var alpha = this.liquids.currentAmount() / LC * 255;
                        Draw.color(this.liquids.current().color);
                        Draw.alpha(alpha);
                        Draw.rect(liquidRegion, this.x + recoilOffsetX, this.y + recoilOffsetY, this.rotation - 90);
                        Draw.alpha(255);
                        Draw.color();
                            
                    }
                    else{
                        Draw.rect(liquidRegion, this.x + recoilOffsetX, this.y + recoilOffsetY, this.rotation - 90);
                    }
                    Draw.rect(Region, this.x + recoilOffsetX, this.y + recoilOffsetY, this.rotation - 90);
                }else{
                    this.drawNormal();
                }
            }
            else{
                this.drawNormal();
            }
        },
        drawConfigure() {
            const sin = Mathf.absin(Time.time, 6, 1);

            Draw.color(Pal.accent);
            Lines.stroke(1);
            Drawf.circles(this.x, this.y, (this.block.size / 2 + 1) * Vars.tilesize + sin - 2, Pal.accent);
            const other = Vars.world.build(this.link);
            if(other != null){
                Drawf.circles(other.x, other.y, (this.block.size / 3 + 1) * Vars.tilesize + sin - 2, Pal.place);
                Drawf.arrow(this.x, this.y, other.x, other.y, this.block.size * Vars.tilesize + sin, 4 + sin, Pal.accent);
            }
            Drawf.dashCircle(this.x, this.y, RANGE * Vars.tilesize, Pal.accent);
        },
        onConfigureBuildTapped(other){
            if(this == other){
                if(this.link == -1){
                    Vars.control.input.config.hideConfig();
                }else{
                    var oth = Vars.world.build(this.link);
                    oth.setShooter(-1);
                    this.link = -1; 
                }
                return;
            }else if(this.link == other.pos()){
                this.link = -1;
                other.setShooter(-1);
                return;
            }else if(this.block.linkValid(this.tile, other.tile)){
                if(this.getShooter() == -1 && other.link == -1 && other.getShooter() == -1){
                    this.link = other.pos();
                    other.setShooter(this);
                }
                return;        
            }       
            return true;
        },
        playerPlaced(config){
            return;
        },
        reloadState(){
            return ((Time.time - this.startTime) * this.power.status >= RELOADTIME);
        },  
        read(read, revision){
            this.super$read(read, revision);
            this.startTime = Time.time;
            this.rotation = read.f();
            this.shooterpos = read.i();
            if(this.shooterpos === undefined){
                this.shooterpos = -1;
            }
        },        
        write(write){
            this.super$write(write);
            write.f(this.rotation);
            write.i(this.shooterpos);
        }
    }, 液体质驱);
})

exports.液体质驱 = 液体质驱;