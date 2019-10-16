
describe("console..", function() {

  
  it("logs a console.log message, adding to console.entries", function() {
    console.log("message");
    expect(console.entries).not.toBeUndefined();
    expect(console.entries.length).toBeGreaterThan(0);
    var lastEntry = console.entries.length-1;
    expect(console.entries[lastEntry]).toEqual("message");
  });
      
  xit("opens console viewer on CONSOLE button handler", function() {
  });
  
  xit("clears log entries on CLEAR button handler", function() {
  });

  xit("closes console viewer on CLOSE button handler", function() {
  });
  
  xit("updates displayed log entries when console.log called", function() {
  });
  
});
