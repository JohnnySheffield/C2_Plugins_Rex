﻿// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.MoveTo = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.MoveTo.prototype;
		
	/////////////////////////////////////
	// Behavior type class
	behaviorProto.Type = function(behavior, objtype)
	{
		this.behavior = behavior;
		this.objtype = objtype;
		this.runtime = behavior.runtime;
	};

	var behtypeProto = behaviorProto.Type.prototype;

	behtypeProto.onCreate = function()
	{
		
	};

	/////////////////////////////////////
	// Behavior instance class
	behaviorProto.Instance = function(type, inst)
	{
		this.type = type;
		this.behavior = type.behavior;
		this.inst = inst;				// associated object instance to modify
		this.runtime = type.runtime;
	};

	var behinstProto = behaviorProto.Instance.prototype;

	behinstProto.onCreate = function()
	{
        this.activated = this.properties[0];
        this.move = {max:this.properties[1],
                       acc:this.properties[2],
                       dec:this.properties[3]};
        this.target = {x:0 , y:0, angle:0};
        this.is_run = false;  
        this.current_speed = 0;       
        this.remain_distance = 0;
        this.is_hit_target = false;
	};

	behinstProto.tick = function ()
	{
        if (this.is_hit_target)
        {
            this.runtime.trigger(cr.behaviors.MoveTo.prototype.cnds.OnHitTarget, this.inst); 
            this.is_hit_target = false;
        }
        
        if ( (this.activated == 0) || (!this.is_run) ) 
        {
            return;
        }
        
		var dt = this.runtime.getDt(this.inst);
		
        // assign speed
        var is_slow_down = false;
        if (this.move.dec != 0)
        {
            // is time to deceleration?                
            var _speed = this.current_speed;
            var _distance = (_speed*_speed)/(2*this.move.dec); // (v*v)/(2*a)
            is_slow_down = (_distance >= this.remain_distance);
        }
        var acc = (is_slow_down)? (-this.move.dec):this.move.acc;
        if (acc != 0)
            this.current_speed += (acc * dt);
        
        if (this.current_speed > this.move.max)
            this.current_speed = this.move.max;    

		// Apply movement to the object     
        var distance = this.current_speed * dt;
        this.remain_distance -= distance;   

        // is hit to target at next tick?
        if ( (this.remain_distance <= 0) || (this.current_speed <= 0) )
        {
            this.is_run = false;
            this.inst.x = this.target.x;
            this.inst.y = this.target.y;
            this.is_hit_target = true;
        }
        else
        {
            var angle = this.target.angle;
            this.inst.x += (distance * Math.cos(angle));
            this.inst.y += (distance * Math.sin(angle));
        } 

		this.inst.set_bbox_changed();
	}; 

	//////////////////////////////////////
	// Conditions
	behaviorProto.cnds = {};
	var cnds = behaviorProto.cnds;

	cnds.OnHitTarget = function ()
	{
		return true;
	};

	cnds.CompareSpeed = function (cmp, s)
	{
		return cr.do_cmp(this.current_speed, cmp, s);
	};      
    
	//////////////////////////////////////
	// Actions
	behaviorProto.acts = {};
	var acts = behaviorProto.acts;

	acts.SetActivated = function (s)
	{
		this.activated = s;
	};  

	acts.SetMaxSpeed = function (s)
	{
		this.move.max = s;
        if (this.is_run && (this.move.acc==0))
            this.current_speed = this.move.max;
	};      
    
	acts.SetAcceleration = function (a)
	{
		this.move.acc = a;
        if (this.is_run && (a==0))
            this.current_speed = this.move.max;
	};
	
	acts.SetDeceleration = function (a)
	{
		this.move.dec = a;
	};
    
	acts.SetTargetPos = function (_x, _y)
	{
        var dx = _x - this.inst.x;
        var dy = _y - this.inst.y;
        
        this.is_run = true;         
		this.target.x = _x;
        this.target.y = _y; 
        this.target.angle = Math.atan2(dy, dx);
        this.remain_distance = Math.sqrt( (dx*dx) + (dy*dy) );
        this.current_speed = (this.move.acc==0)? this.move.max:0;
	};
    
	//////////////////////////////////////
	// Expressions
	behaviorProto.exps = {};
	var exps = behaviorProto.exps;
    
	exps.Activated = function (ret)
	{
		ret.set_int(this.activated);
	};    
    
	exps.Speed = function (ret)
	{
		ret.set_float(this.current_speed);
	};
    
	exps.MaxSpeed = function (ret)
	{
		ret.set_float(this.move.max);
	}; 

	exps.Acc = function (ret)
	{
		ret.set_float(this.move.acc);
	};  

 	exps.Dec = function (ret)
	{
		ret.set_float(this.move.dec);
	}; 

	exps.TargetX = function (ret)
	{
        var x = (this.is_run)? this.target.x:0;
		ret.set_float(x);
	};  

 	exps.TargetY = function (ret)
	{
        var y = (this.is_run)? this.target.y:0;
		ret.set_float(y);
	};     
    
}());