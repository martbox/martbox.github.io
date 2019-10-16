/*

var setting = new SettingHandler();
setting.add("NAME", "initialValue", format)
setting.NAME.set("value");
setting.NAME.get();

where format specification can be..
"string" "number" "boolean" "function" "object" 123 true "abc" {a:123} function(){}

*/
	
(function(){

function Setting(name, initialValue, _format){
	this.name = name;
	this.value = initialValue==undefined ? null : initialValue;
	this.format = new Format(_format);
}
Setting.prototype.set = function(value){
	if(this.format.validate(value)) {
		this.value = value;
	}
	else {
		throw "Value being set for '"+this.name+"' does not match expected format";
	}
};

Setting.prototype.get = function(){
	return this.value;
};

function SettingHandler(){
	this.add = function(name, initialValue, format){
		this[name] = new Setting(name, initialValue, format);
	};
}


window.SettingHandler = SettingHandler;

})();


