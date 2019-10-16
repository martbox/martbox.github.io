
describe("LogHandler ", function() {

var log = null;

  beforeEach(function(done) {
	require(['LogHandler'],function(LogHandler){
		log = new LogHandler();
		done();
	});
  });
  
  afterEach(function() {
    log = null;
  });

  it("registers new logger when you call add(name)", function() {
    log.add("myLogger");
	 expect(log.hasOwnProperty("myLogger")).toBe(true);
  });
  
  it("reports false logging debug and true logging warn when log level is set to 'log'", function() {
    log.add("myLogger");
		log.myLogger.on();
		log.myLogger.log(true);
		expect(log.myLogger.log()).toBe(true);
		
		expect(log.myLogger.debug()).toBe(false);
		expect(log.myLogger.D).toBe(false);
		expect(log.myLogger.warn()).toBe(true);
		expect(log.myLogger.W).toBe(true);
  });
  
  it("outputs message to console log if logger switched on and level is 'log'", function() {
    log.add("myLogger");
	log.myLogger.on();
	log.myLogger.log(true);
	expect(log.myLogger.log()).toBe(true);
	
	spyOn(console, "log").and.callThrough();
	log.myLogger.log("log msg");
	expect(console.log).toHaveBeenCalledWith("myLogger : log msg");
	console.log.calls.reset();
  });
  
  it("outputs message to console log if logger switched on and level is 'warn'", function() {
    log.add("myLogger");
	log.myLogger.on();
	log.myLogger.warn(true);
	expect(log.myLogger.warn()).toBe(true);
	
	spyOn(console, "warn").and.callThrough();
	log.myLogger.warn("warn msg");
	expect(console.warn).toHaveBeenCalledWith("myLogger : warn msg");
	console.warn.calls.reset();
  });
  
  it("outputs message to console log if log handler used to switch logger on and level is 'warn'", function() {
    log.add("myLogger");
	log.on();
	log.myLogger.warn(true);
	expect(log.myLogger.warn()).toBe(true);
	
	spyOn(console, "warn").and.callThrough();
	log.myLogger.warn("warn msg");
	expect(console.warn).toHaveBeenCalledWith("myLogger : warn msg");
	console.warn.calls.reset();
  });
  
  it("does NOT output message to console log if logger switched off", function() {
    log.add("myLogger");
	//log.myLogger.off();
	log.myLogger.log(true);
	//expect(log.myLogger.log()).toBe(false);
	//expect(log.myLogger.L).toBe(false);
	spyOn(console, "log").and.callThrough();
	log.myLogger.log("hello");
	expect(console.log).not.toHaveBeenCalledWith("myLogger : hello");
  });
  
  });