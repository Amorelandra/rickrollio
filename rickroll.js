;(function() {

    var fs = require('fs');

    /**
    * Load and verify configuration
    */
    var config = (function() {

        try {

            var buff = fs.readFileSync('./config.json');

            var 
                conf = JSON.parse(buff)
                , error = undefined
            ;

            if(!conf.accountSid) {

                error = "Invalid accountSid";
            }
            else if((!conf.numbers) || !conf.numbers.from 
                || !conf.numbers.to) {

                error = "Invalid number parameters";
            }
            else if(!conf.authToken) {

                error = "Invalid authToken";
            }
            else if (!conf.applicationSid) {

                error = "Invalid accountSid";
            }
            else if (!conf.play) {
                error = "Invalid play URL";
            }

            if(error) {

                console.log("config.json: %s\r\n", error);
                process.exit(1);
            }
        }
        catch (e) {

            console.log("config.json: %s\r\n", e);
            process.exit(2);
        }

        return conf;
    })();

    var
        express = require('express') 
        , twilio = require('twilio-api')
        , async = require('async')
        , dnode = require('dnode')
        , net = require('net')
        , app = express.createServer()
        , voiceActive = false   // in a call
        , twapp                 // twilio app
        , cli = new twilio.Client(

            config.accountSid
            , config.authToken
        )
    ;

    app.use(cli.middleware());
    app.listen(config.ports.app);

    cli.account.getApplication(config.applicationSid, function(err, twip) {

    	if(err) { 

    		console.log(err);
    		return;
    	}

        twapp = twip;
    	twip.register();
        callEveryone("RICKROLL", function(err, res) {

            if(err) { console.log(err); return; }
            console.log("rickroll complete...");
            console.log(res);
            process.exit(0);
        });
    });

    /**
    * Alert everyone on the call list
    */
    var callEveryone = function callEveryone(id, done) {
        
        var calls = [];

        config.numbers.to.forEach(function(num) {

            calls.push(getCaller(id, num));
        });

        async.parallel(calls, function(err, res) {

            if(err) {

                done(err, undefined);
                return;
            }

            done(null, res);
        });
    };

    /**
    * Wrap a placeCall call with async callback
    */
    var getCaller = function getCaller(id, num) {

        return function(cb) {

            placeCall(id, num, cb);
        }
    };

    /**
    * Initiate a voice alert
    */
    var placeCall = function placeCall(id, num, cb) {

        if(!num || typeof cb !== "function") {

            console.log("Invalid placeCall parameters.");
            return false;
        }

         twapp.makeCall(config.numbers.from, num, function(err, call) {

            if(err) throw err;

            call.on('connected', function(status) {

                //Called when the caller picks up
                call.play(config.play);
            });

            call.on('ended', function(status, duration) {

                cb(null, status, duration); 
            });
        });    	
    };

})();