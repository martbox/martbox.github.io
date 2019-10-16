
describe("SettingHandler Spec", function() {

var setting = new SettingHandler();
    
  it("adds a setting on call of add(name, value, format)", function() {
    setting.add("mySetting", null, "number");
	expect(setting.hasOwnProperty("mySetting")).toBe(true);
  });
  
  it("sets/gets when set/get functions called", function() {
    setting.add("mySetting", null, "number");
	setting.mySetting.set(1234);
	expect(setting.mySetting.get()).toEqual(1234);
  });

  
  });