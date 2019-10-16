
var lh = new LogHandler();

lh.add("myLogger");

lh.myLogger.on();

lh.myLogger.off();

lh.myLogger.isOn();

lh.myLogger.warn(true); //set this as log level

lh.myLogger.warn(); //returns whether logging this level
lh.myLogger.W;

lh.myLogger.warn("my warn message");



lh.on();  //all loggers enabled

lh.off();  //all loggers disabled

var newlogger = lh.add('newloggername');
2;,
lh.warn(true); //change log level for all loggers