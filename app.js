//used in azure
//"use strict";
//var builder = require("botbuilder");
//var botbuilder_azure = require("botbuilder-azure");
//var path = require('path');

//var useEmulator = (process.env.NODE_ENV == 'development');

// used in local env
var restify = require('restify');
var builder = require('botbuilder');
var pg = require('pg');
var format = require('pg-format')
var fs  = require("fs");
/*
var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});*/

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});



//var conString = "pg://postgres:paidb@localhost:5433/paidb";
var conString = "postgres://postgres@paidb:Pai-the-bot17@paidb.postgres.database.azure.com:5432/paidb?ssl=false";
var qnoid = 0;
var client = new pg.Client(conString);
client.connect();


var supportedLangs= ["Java","C#","Python","Perl"];//,"sql","shell","javascript","project management","database","sybase"];
var affirmation = ["yes","ok","okay","cool","sure","why not","fine","definitely","ya","yeah"];
var useEmulator = (process.env.NODE_ENV == 'development')


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});



// Listen for messages from users
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector);

bot.recognizer({
  recognize: function (context, done) {
  var intent = { score: 0.0 };

        if (context.message.text) {
            switch (context.message.text.toLowerCase()) {
                case 'help':
                    intent = { score: 1.0, intent: 'Help' };
                    break;
                case 'goodbye':
                    intent = { score: 1.0, intent: 'Goodbye' };
                    break;
                case 'quit':
                    intent = { score: 1.0, intent: 'Goodbye' };
                    break;
                case 'ready':
                    intent = { score: 1.0, intent: 'Ready' };
                    break;
                case 'ready now':
                    intent = { score: 1.0, intent: 'Ready' };
                    break;
                case ' i m ready':
                    intent = { score: 1.0, intent: 'Ready' };
                    break;
                case ' Thanks':
                    intent = { score: 1.0, intent: 'Thanks' };
                    break;
                case ' Bye':
                    intent = { score: 1.0, intent: 'Bye' };
                    break;
            }
        }
        done(null, intent);
    }
});


bot.dialog('/', new builder.IntentDialog()
    .matches(/^ready/i, '/ready')
    .matches(/^thanks/i, '/goodbye')
    .matches(/^bye/i, '/goodbye')
    .matches(/^quit/i, '/goodbye')
    .onDefault('/begin'));
bot.dialog('/begin', [
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/intro');
        } else {
            session.send("Hi " + session.userData.name);
            next();
        }
    },
    function (session, results) {
        builder.Prompts.text(session,"Would you like to take mock interview today ?");
    },
    function (session, results) {
        if( (new RegExp( '\\b' + affirmation.join('\\b|\\b') + '\\b') ).test(results.response.toLowerCase()) ){
                session.send("Alright..Let's get started");
    //           var msg =  selectProgrammingLanguage(session);
             //  var msg = new builder.Message(session).addAttachment(card);
     //          session.send(msg);
    
      //         session.send("What would you like to assess yourself on today ?");
      //         builder.Prompts.text(session, "You can type something like 'Project Management' or 'Java' or 'Python'");
                 builder.Prompts.choice(session,"What would you like to assess yourself on today ?",supportedLangs, {listStyle : builder.ListStyle.button});
        }
        else {
			console.log(results.response.value);
            session.sendTyping();
            session.send('That is okay. Let me know whenever you are ready');
            session.endConversation();
        }

    },
    function (session, results) {
        session.userData.skill = results.response.entity;
        console.log(session.userData.skill);
        session.send("Great. I love " + session.userData.skill);
   /*     
        var isValidLang = 0;
        if( (new RegExp( '\\b' + supportedLangs.join('\\b|\\b') + '\\b') ).test(session.userData.skill.toLowerCase()) ){
            session.send("Great. I love " + session.userData.skill);
            isValidLang = 1;
        }
        else{
            session.send("Oops..looks like I am not aware of this skill. You see I am still learing. I will certainly get back to you when I am ready for this skill");
            session.endConversation();

        }
 */
        session.sendTyping();
        builder.Prompts.number(session, "And how many years of experience do you have in " + session.userData.skill + " ?");

    },
    function (session, results) {
        session.userData.coding = results.response;
        session.send("Thats great... " + session.userData.name);
        session.sendTyping();
  //      session.send("So let's get started. I will start with some basic questions in " + session.userData.skill + " and depending upon how you perform will go deeper");
        builder.Prompts.text(session, "Is that okay ?");
    },
    function (session, results) {
        var isReady = results.response.toLowerCase();
        if( (new RegExp( '\\b' + affirmation.join('\\b|\\b') + '\\b') ).test(isReady) ){
            session.send("Perfect");
            session.beginDialog('/beginDiscussion');
        }
        else{
            session.send("Looks like you are not ready yet.");
            session.send("Not an issue. Just say 'ready' whenever you want to start");
            session.endDialog();
            
        }

    }
]);

bot.dialog('helpDialog', function (session) {
    session.send("What can I help you with "+ session.userData.name + "?");
    session.endDialog();
}).triggerAction({ matches: 'Help' });

bot.dialog('quitDialog', function (session) {
    session.send("Thanks for your valuable time "+ session.userData.name);
    session.endConversation(); 
    
}).triggerAction({ matches: 'Goodbye' });

bot.dialog('readyDialog', function (session) {
      session.send("Alright "+ session.userData.name);
      session.send("Ok. At anytime during our discussion just say help if you have any queries");
      session.beginDialog('/beginDiscussion');
      qnoid = 0;
      session.endDialog();
}).triggerAction({ matches: 'Ready' });

bot.dialog('/beginDiscussion',  [
    function(session) 
    {
     // session.send("Here we go.. starting interview...");
      qnoid = qnoid + 1;
      var getquestions = format("select question,answer from p_questions where qid= %L", qnoid);
      var questions = [];
       
      var query = client.query(getquestions);//, function(err,data){
      query.on('row',function(row,result) {
         result.addRow(row);
         questions.push(row);
      });
      query.on('end', function(result) {
      //  client.end();
        console.log(JSON.stringify(result.question));
        console.log(result.rowCount + " rows are received");
        questions.forEach(function(row) {
            var q = JSON.stringify(row.question);
            var a = JSON.stringify(row.answer);
            console.log(JSON.stringify(row.question));
            console.log(JSON.stringify(row.answer));
            session.beginDialog('/question',row);
        });
     });
    }
 ]);

bot.dialog('/question', [
    function(session,args, next) {
        var row = args || {};
        var que = JSON.stringify(row.question);
        var ans = JSON.parse(JSON.stringify(row.answer));
        console.log("Question is "+ ans);
        builder.Prompts.choice(session,que.toString(),ans, {listStyle : builder.ListStyle.button});
        
    },
    function(session,results) {
        var ans = results.response.entity;
      //  session.send("You answered : " + ans );
        if (qnoid === 5){
            client.end();
            session.send("Thanks for your time " + session.userData.name + " I will share the results with you on your email id");
            session.endDialog();
        }
        else{
            session.beginDialog('/beginDiscussion');
        }
        
    }
]);

bot.dialog('/intro', [
    function (session) {
        builder.Prompts.text(session, "Hello... What's your name?");
    },
    function (session, results) {
        var name = "'" + results.response.toString() + "'";
        session.userData.name = results.response.toString(); //.split(" ")[0];
        console.log("Inside Intro. User types " + results.response.toString());
        var qry = format("SELECT * FROM p_users where f_name=%s",name);
     //   console.log(qry);
        client.query(qry,function(err,result){
            if(err) {
                console.log("Inside err");
                session.send("Hi " + name);
                session.sendTyping();
                session.send("I am Pai from TapRep. They say I am tech genius and I can help you become one"); //and my job is to take online interviews for screening");
                session.endDialog();
                return;
            }
            console.log("Out of error condition" + result.length) ;
            if(result.length){
                console.log(JSON.stringify(result.f_name));
                session.send("Welcome back " + name +  "!");
            }
            else {
                session.send("Hi " + name);
                session.sendTyping();
                session.send("I am Pai from TapRep. They say I am tech genius and I can help you become one");
                session.endDialog(); 
            }
            
            session.endDialog();
        });
		           
    }
]);

bot.dialog('/goodbye', [
    function (session) {
        session.send("Nice talking to you " + session.userData.name);
        session.endConversation("See ya later. Bye");
    }
]);
if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());
} else {
    module.exports = { default: connector.listen() }
}

function selectProgrammingLanguage(session) {
    return new builder.Message(session).addAttachment({
        contentType : "application/vnd.microsoft.card.adaptive",
        content : {
            type :  "AdaptiveCard",
            body : [
                {
                    "type" : "TextBlock",
                    "id" : "lang",
                    "text" : "Select your prefered language",

                }],
                "actions" :[
                	{
                        "type" : "imBack",
                        "title" : "Java",
                        "value" : "Java"
				    },
				    {
                        "type" : "imBack",
                        "title" : "Python",
                        "value" : "Python"
                    },
                    {
                        "type" : "imBack",
                        "title" : "C#.net",
                        "value" : "C#.Net"
                    },
                    {
                        "type" : "imBack",
                        "title" : "Perl",
                        "value" : "Perl"
                    }

                    ]

        }
    });
  }

