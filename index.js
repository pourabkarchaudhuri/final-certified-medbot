'use strict';
//var conditionKeyDatabase = require('../conditionCodes');
var request=require('request-promise');
var pureRequest=require('request');

const VERSION = '1.0';
//
function buildSpeechletResponse(cardOutput, speechOutput, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "SSML",
            ssml: speechOutput
        },
        card: cardOutput,
        reprompt: {
            outputSpeech: {
                type: "SSML",
                ssml: repromptText
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {

    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}

// ------------------- Mandatory Alexa Launch and Runtime Functions that control the skill's behavior --------------------------------------

function getWelcomeResponse(callback) {
    console.log("WELCOME INTENT TRIGGERED");
    const sessionAttributes = {};
    const cardTitle = 'Greetings from Medbot!';
    const speechOutput = '<speak>Hello, I am MedBot, your medical assistant. This skill does not provide medical advice, and is for suggestive information only. It is not a substitute for professional medical advice, treatment or diagnosis. If you think you may have a medical emergency then call a professional doctor. Now begin by saying, Give me my diagnosis or, what to do if I have, and then the condition name.</speak>';
    const repromptText = '<speak>You can simply say help to know what to say.</speak>';
    const shouldEndSession = false;

    //THIS BLOCK CONTAINS ALEXA SPEECH STRINGS TO TRIGGER WHEN 'LaunchRequest' is executed and called.
    callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
    //Callback function sends back strings to the 'buildSpeechletResponse'
}

function getHelpResponse(callback) {
    console.log("HELP INTENT TRIGGERED");
    const sessionAttributes = {};
    const cardTitle = 'Help to the Medbot';
    const speechOutput = '<speak>You ask me to give you your diagnosis. Just say, I want my diagnosis, or you can ask me what to do in case of a medical condition. I will only give you suggestions based on what you say.</speak>';
    const repromptText = '<speak>Could you repeat that?</speak>';
    //shouldEndSession = false indicates :ask mode where alexa waits for response.
    const shouldEndSession = false;
    const cardOutput = {
                          "type": "Standard",
                          "title": "Skill Instructions",
                          "text": "To know more about a medical condition, say e.g 'What to do in case of malaria?'\nFor a diagnosis based on symptoms, say 'Give me my diagnosis.'\nConditions and symptoms are subjective to availability in our skill's database."
                        };
    //THIS BLOCK CONTAINS ALEXA SPEECH STRINGS TO TRIGGER WHEN 'LaunchRequest' is executed and called.
    callback(sessionAttributes,buildSpeechletResponse(cardOutput, speechOutput, repromptText, shouldEndSession));
    //Callback function sends back strings to the 'buildSpeechletResponse'
}

function getYesResponse(intent, session, callback){
    console.log("FEEDBACK TRUE FOR YES INPUT INTENT TRIGGERED");
    if(global.followUpCounter==1)
    {
      global.yesFlag=1;
      processSymptom(intent, session, callback);
      //callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
      //buildSpeechletResponse sends to uppermost block for ssml response processing
      //callback sends it back
    }
}

function getNoResponse(intent, session, callback){
    console.log("FEEDBACK TRUE FOR YES INPUT INTENT TRIGGERED");
    if(global.followUpCounter==1)
    {
      global.yesFlag=2;
      processSymptom(intent, session, callback);
      //callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
      //buildSpeechletResponse sends to uppermost block for ssml response processing
      //callback sends it back
    }
}

function handleSessionEndRequest(callback) {
    console.log("SESSION ENDED INTENT TRIGGERED");
    const sessionAttributes = {};
    const cardTitle = 'Session Ended';
    const speechOutput = '<speak>Thank you using Medbot, your personal medical assistant! Hope I was helpful.</speak>';
    //shouldEndSession = false indicates :tell mode where alexa waits for response.
    const shouldEndSession = true;
    //THIS BLOCK CONTAINS ALEXA SPEECH STRINGS TO TRIGGER WHEN 'SessionEndedRequest' is executed and called.
    callback(sessionAttributes, buildSpeechletResponse(null, speechOutput, null, shouldEndSession));
    //Callback function sends back strings to the 'buildSpeechletResponse'
}

function saySatisfactory(intent, session, callback) {
    handleSessionEndRequest(callback);
    //SESSION END 'CancelIntent': SIMPLY CHANGE STRINGS. THIS IS FOR handleSessionEndRequest
}

// --------------------------------------- Functions that control the skill's behavior ---------------------------------------------------

function sayHelloWorld(intent, session, callback){
    console.log("HELLO WORLD INTENT TRIGGERED");
    const sessionAttributes = {};
    const cardTitle = 'Hello Intent Triggered!';
    const speechOutput = '<speak>Hello there. For more information on how to use this skill, just say help.</speak>';
    const repromptText = '<speak>You can say help, and i will explain what you can ask me.</speak>';
    const shouldEndSession = false;
    //':ask' mode
    callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
    //buildSpeechletResponse sends to uppermost block for ssml response processing
    //callback sends it back
}

function sayConditionInquiry(intent, session, callback){
    console.log("CONDITION DETAILS INQUIRY INTENT TRIGGERED");
    var conditionInquirySlot=intent.slots.inputCondition.value;
    if(conditionInquirySlot!=undefined)
    {
          console.log("Condition Input from User  : "+conditionInquirySlot);

          var buildURL='https://api.infermedica.com/v2/conditions';
          console.log("URL Built : "+buildURL);
          var options = { method: 'GET',
          url: buildURL,
          headers:
          { 'postman-token': '20cd3cf6-7a8e-9e62-3405-9603fd782d59',
            'cache-control': 'no-cache',
            'app-id': 'a4aad43a',
            'app-key': 'cb656061c337e54678d8d75ce5a14fde',
            'content-type': 'application/json' } };

            request(options,conditionInquirySlot,function (error, response, body) {
              if (error) throw new Error(error);
              console.log(body);
              console.log(typeof body);

              console.log("User Input Inside Call Function : "+conditionInquirySlot);

              var conditionInquirySlotFinal = conditionInquirySlot.charAt(0).toUpperCase() + conditionInquirySlot.slice(1);
              console.log("Processed Input to Match with Database : "+conditionInquirySlotFinal);
              var conditionKeyDatabase=JSON.parse(body);
              //console.log("Complete Body Recieved : "+conditionKeyDatabase);
              var flag=0;
              var index;
              var i;
              var jsonLength=conditionKeyDatabase.length;
              console.log("JSON Length : "+jsonLength);
              console.log("Database Activity Check : "+conditionKeyDatabase[1].name);
              //console.log(conditionKeyDatabase[1].name.toLowerCase());
              for(i=0;i<jsonLength;i++)
              {
                  if(conditionInquirySlotFinal==conditionKeyDatabase[i].name)
                  {

                    flag=1;
                    index=i;

                  }
              }


                if(flag==1)
                {
                  var conditionCodeFound=conditionKeyDatabase[index].id;
                  console.log("Code Found : "+conditionCodeFound);

                  var conditionId=conditionKeyDatabase[index].id;
                  console.log("Condition ID : "+conditionId);
                  var conditionName=conditionKeyDatabase[index].name;
                  console.log("Condition Name : "+conditionName);
                  var conditionPrevalence=conditionKeyDatabase[index].prevalence;
                  var conditionPrevalence = conditionPrevalence.charAt(0).toUpperCase() + conditionPrevalence.slice(1);
                  var conditionPrevalence=conditionPrevalence.replace(/_/g,' ');
                  console.log("Condition Prevalence : "+conditionPrevalence);
                  var conditionSeverity=conditionKeyDatabase[index].severity;
                  var conditionSeverity = conditionSeverity.charAt(0).toUpperCase() + conditionSeverity.slice(1);
                  var conditionSeverity=conditionSeverity.replace(/_/g,' ');
                  console.log("Condition Severity : "+conditionSeverity);
                  var conditionAcuteness=conditionKeyDatabase[index].acuteness;
                  var conditionAcuteness = conditionAcuteness.charAt(0).toUpperCase() + conditionAcuteness.slice(1);
                  var conditionAcuteness=conditionAcuteness.replace(/_/g,' ');
                  console.log("Condition Acuteness : "+conditionAcuteness);
                  var conditionAdvice=conditionKeyDatabase[index].extras.hint;
                  console.log("Condition Advice : "+conditionAdvice);
                  var conditionSexFilter=conditionKeyDatabase[index].sex_filter;
                  console.log("Condition Sex Filter : "+conditionSexFilter);

                  const sessionAttributes = {};
                  const cardTitle = 'Conditions Inquiry Code is Found Triggered!';
                  const speechOutput = `<speak>This is a ${conditionSeverity} condition. ${conditionAdvice}. I\'ve also sent some more detailed information to your companion app.</speak>`;
                  const repromptText = '<speak>Are you there? Speak up.</speak>';
                  const shouldEndSession = true;

                  const cardOutput = {
                                        "type": "Standard",
                                        "title": "Medical Condition Details",
                                        "text": `Condition Name : ${conditionName}\nPrevalence : ${conditionPrevalence}\nSeverity : ${conditionSeverity}\nAcuteness : ${conditionAcuteness}\n Advice : ${conditionAdvice}`
                                      };
                  //':ask' mode
                  callback(sessionAttributes,buildSpeechletResponse(cardOutput, speechOutput, repromptText, shouldEndSession));
                  //buildSpeechletResponse sends to uppermost block for ssml response processing
                  //callback sends it back
                }
                else if(flag==0)
                {
                  const sessionAttributes = {};
                  const cardTitle = 'Conditions Inquiry Code is not Found Triggered!';
                  const speechOutput = `<speak>I don\'t know about this condition. Is it new? I have to look it up later.</speak>`;
                  const repromptText = '<speak>Are you there? Speak up.</speak>';
                  const shouldEndSession = true;

                  //':ask' mode
                  callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
                  //buildSpeechletResponse sends to uppermost block for ssml response processing
                  //callback sends it back
                }

            });
        }//end of IF NOT EQUALS UNDEFINED
        else if(conditionInquirySlot==undefined)
        {
              const sessionAttributes = {};
              const cardTitle = 'Conditions Inquiry Code is not Found Triggered!';
              const speechOutput = `<speak>I didn\'t get a condition name. Try repeating the condition name clearly.</speak>`;
              const repromptText = '<speak>Are you there? Speak up.</speak>';
              const shouldEndSession = false;

              //':ask' mode
              callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
              //buildSpeechletResponse sends to uppermost block for ssml response processing
              //callback sends it back
        }//end of IF IT IS UNDEFINED
  }


function sayTriggerDiagnosis(intent, session, callback){
    console.log("TRIGGER DIAGNOSIS INTENT TRIGGERED");
    const sessionAttributes = {};
    const cardTitle = 'Triggered Diagnosis Triggered!';
    const speechOutput = '<speak>Can you please tell me your gender type?</speak>';
    const repromptText = '<speak>Are you there? Speak up.</speak>';
    const shouldEndSession = false;
    //':ask' mode
    global.followUpCounter=0;
    global.yesFlag=0;
    callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
    //buildSpeechletResponse sends to uppermost block for ssml response processing
    //callback sends it back


}


function sayDiagnosisSexInput(intent, session, callback){
    console.log("INPUT SEX FOR DIAGNOSIS INTENT TRIGGERED");
    var diagnosisSex=intent.slots.inputDiagnosisSex.value;
    global.diagnosisSex=diagnosisSex;
    if(global.diagnosisSex!=undefined)
    {
          if(global.diagnosisSex=="male"||global.diagnosisSex=="female")
          {
                console.log("Global Input Diagnosis Sex : "+global.diagnosisSex);

                const sessionAttributes = {};
                const cardTitle = 'Input Sex for Diagnosis Triggered!';
                const speechOutput = '<speak>Okay. Now kindly tell me your age.</speak>';
                const repromptText = '<speak>Are you there? Just say male or female.</speak>';
                const shouldEndSession = false;
                //':ask' mode
                callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
                //buildSpeechletResponse sends to uppermost block for ssml response processing
                //callback sends it back
          }
          else{
                const sessionAttributes = {};
                const cardTitle = 'Input Sex for Diagnosis Triggered!';
                const speechOutput = '<speak>Try saying your gender type clearly again.</speak>';
                const repromptText = '<speak>You can say male or female to get started.</speak>';
                const shouldEndSession = false;
                //':ask' mode
                callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
                //buildSpeechletResponse sends to uppermost block for ssml response processing
                //callback sends it back

          }
      }
      else {
            const sessionAttributes = {};
            const cardTitle = 'Input Sex for Diagnosis Triggered!';
            const speechOutput = '<speak>Try saying your gender type clearly again.</speak>';
            const repromptText = '<speak>You can say male or female to get started.</speak>';
            const shouldEndSession = false;
            //':ask' mode
            callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
            //buildSpeechletResponse sends to uppermost block for ssml response processing
            //callback sends it back

      }
}

function sayDiagnosisAgeInput(intent, session, callback){
    console.log("INPUT AGE OF PATIENT FOR DIAGNOSIS INTENT TRIGGERED");
    var diagnosisAge=intent.slots.inputDiagnosisAge.value;
    global.diagnosisAge=diagnosisAge;
    if(global.diagnosisAge!=undefined)
    {
      if(global.diagnosisAge>0&&global.diagnosisAge<100)
      {
          console.log("Global Input Diagnosis Age : "+global.diagnosisAge);

          const sessionAttributes = {};
          const cardTitle = 'Input Age for Diagnosis Triggered!';
          const speechOutput = '<speak>You may start by giving one symptom that you are facing. I will ask you some questions if I recognise the symptom. Answer with yes or no.</speak>';
          const repromptText = '<speak>Tell me a symptom like, I have a severe headache.</speak>';
          const shouldEndSession = false;
          //':ask' mode
          callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
          //buildSpeechletResponse sends to uppermost block for ssml response processing
          //callback sends it back
      }
      else if(global.diagnosisAge==0){
        console.log("Global Input Diagnosis Age : "+global.diagnosisAge);

        const sessionAttributes = {};
        const cardTitle = 'Input Age for Diagnosis Triggered!';
        const speechOutput = '<speak>You can\'t be zero years old. Please Try repeating with a proper age number.</speak>';
        const repromptText = '<speak>Just give me your proper age or say, I am this many years old.</speak>';
        const shouldEndSession = false;
        //':ask' mode
        callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
        //buildSpeechletResponse sends to uppermost block for ssml response processing
        //callback sends it back
      }
      else if(global.diagnosisAge>=100){
        console.log("Global Input Diagnosis Age : "+global.diagnosisAge);

        const sessionAttributes = {};
        const cardTitle = 'Input Age for Diagnosis Triggered!';
        const speechOutput = `<speak>You are ${global.diagnosisAge} years old? My god. I probably shouldn\'t give you suggestions then. Give me an age less than 100 years to proceed.</speak>`;
        const repromptText = '<speak>Just give me your proper age or say, I am this many years old.</speak>';
        const shouldEndSession = false;
        //':ask' mode
        callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
        //buildSpeechletResponse sends to uppermost block for ssml response processing
        //callback sends it back
      }
    }
    else {
      const sessionAttributes = {};
      const cardTitle = 'Input Age for Diagnosis Triggered!';
      const speechOutput = '<speak>I didn\'t get that. Could you say your age again?</speak>';
      const repromptText = '<speak>Just give me your age or say, I am this many years old.</speak>';
      const shouldEndSession = false;
      //':ask' mode
      callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
      //buildSpeechletResponse sends to uppermost block for ssml response processing
      //callback sends it back
    }
}

function saySymptom(intent, session, callback){
    console.log("SYMPTOM INPUT FOR DIAGNOSIS INTENT TRIGGERED");
    var diagnosisSymptomSlotLang=intent.slots.inputDiagnosisSymptomLang.value;
    console.log("NLP Detects : "+diagnosisSymptomSlotLang);
    var diagnosisSymptomSlotName=intent.slots.inputDiagnosisSymptomName.value;
    console.log("Symptom Detects : "+diagnosisSymptomSlotName);
    var diagnosisSymptomSlotFinal = diagnosisSymptomSlotLang.charAt(0).toUpperCase() + diagnosisSymptomSlotLang.slice(1) + " " + diagnosisSymptomSlotName;
    global.diagnosisSymptomSlot=diagnosisSymptomSlotFinal;
    console.log("Global Input Diagnosis Symptom : "+global.diagnosisSymptomSlot);

    var options = { method: 'POST',
    url: 'https://api.infermedica.com/v2/parse',
    headers:
    { 'postman-token': '785d8d42-c9fd-b137-d1da-e44cfa4d64f1',
     'cache-control': 'no-cache',
     'app-id': 'a4aad43a',
     'app-key': 'cb656061c337e54678d8d75ce5a14fde',
     'content-type': 'application/json' },
     body: { text: global.diagnosisSymptomSlot, include_tokens: false },
     json: true };

     request(options, function (error, response, body) {
       if (error) throw new Error(error);

       //console.log(body);
       console.log(body.mentions);
       if(body.mentions.length==0)
       {

         console.log("NLP DID NOT RETURN SYMPTOM ID");
         console.log(body);
         const sessionAttributes = {};
         const cardTitle = 'Symptoms for Diagnosis Triggered!';
         const speechOutput = `<speak>I didn\'t get that. Try rephrasing that symptom. Give me one symptom at a time.</speak>`;
         const repromptText = '<speak>Are you there? Speak up.</speak>';
         const shouldEndSession = false;
         //':ask' mode
         callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
       }
       else
       {
         console.log("NLP RETURNED SYMPTOM ID");
         console.log(body);
         var diagnosisSymptomName=body.mentions[0].name;
         global.diagnosisSymptomName=diagnosisSymptomName;
         console.log("NLP Diagnosed Symptom Name : "+diagnosisSymptomName);
         var diagnosisSymptomId=body.mentions[0].id;
         global.diagnosisSymptomId=diagnosisSymptomId;
         console.log("NLP Diagnosed Symptom ID : "+diagnosisSymptomId);
         var diagnosisSymptomStatus=body.mentions[0].choice_id;
         global.diagnosisSymptomStatus=diagnosisSymptomStatus;
         console.log("NLP Diagnosed Symptom Status : "+diagnosisSymptomStatus);
         var diagnosisSymptomType=body.mentions[0].orth;
         console.log("NLP Diagnosed Symptom Type : "+diagnosisSymptomType);

         processSymptom(intent, session, callback);
       }
     });
}

function processSymptom(intent, session, callback){

    console.log("PROCESSING FOR FURTHER DIAGNOSIS INTENT TRIGGERED");
    if(global.followUpCounter==1)
    {
        console.log("global.followUpCounter==1");
        if(global.yesFlag==1)
          {
            //YES WAS TRIGGERED, SO SYMPTOM IS PRESENT
            console.log("global.yesFlag==1");
            global.diagnosisSymptomStatus='present';

            global.result.push({id: global.followUpSymptomId, choice_id: global.diagnosisSymptomStatus});
            var buildBody= { sex: global.diagnosisSex,
                             age: global.diagnosisAge,
                             evidence: global.result
                           };
            console.log("Follow Up Counter 1 && global.yesFlag=1 (Present) : "+buildBody);

          }

        else if(global.yesFlag==2)
          {
            //NO WAS TRIGGERED, SO SYMPTOM IS ABSENT
            console.log("global.yesFlag==2");
            global.diagnosisSymptomStatus='absent';

            global.result.push({id: global.followUpSymptomId, choice_id: global.diagnosisSymptomStatus});
            var buildBody= { sex: global.diagnosisSex,
                             age: global.diagnosisAge,
                             evidence: global.result
                           };
            console.log("Follow Up Counter 1 && global.yesFlag=2 (Absent) : "+buildBody);
          }
    }
    else if(global.followUpCounter==0)
    {
        console.log("global.followUpCounter==0");
        var result = [];
        global.result=result;
        global.result.push({id: global.diagnosisSymptomId, choice_id: global.diagnosisSymptomStatus});
        var buildBody= { sex: global.diagnosisSex,
                         age: global.diagnosisAge,
                         evidence: global.result
                       };
        console.log("Follow Up Counter 0 : "+JSON.stringify(buildBody));
    }

    //NIER POINT
    console.log("Ready to send Request");
    var options = { method: 'POST',
    url: 'https://api.infermedica.com/v2/diagnosis',
    headers:
    { 'postman-token': 'c85c7ea4-fc05-cd5c-2936-d20592218957',
      'cache-control': 'no-cache',
      'app-id': 'a4aad43a',
      'app-key': 'cb656061c337e54678d8d75ce5a14fde',
      'content-type': 'application/json' },
      body: buildBody,
      json: true };

      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        console.log("POST request");
        console.log("Recieved Body"+JSON.stringify(body));
        console.log("Number of Probable Conditions : "+body.conditions.length);
        var bodyLength=body.conditions.length;
        var i=0;
        var index;
        var flag=0;
        for(i=0;i<bodyLength;i++)
        {
          if(body.conditions[i].probability>=0.9000)
          {
            index=i;
            flag=1;
          }
        }
        //FOUND THE PROBABILTIES INDEX FOR HIGHER THAN 90 PERCENT
        //-------------------------------------------------------
        console.log("Probability Boolean : "+flag);
        if(body.question.type==='single')
        {
            console.log("Single Type Question Returned");
            if(flag==1)
            {
                //console.log(body);

                console.log("HIGHEST FOUND");
                console.log("Name of disease : "+body.conditions[index].name);
                var finalDiseaseName=body.conditions[index].name;
                global.finalDiseaseName=finalDiseaseName;
                console.log("Id of disease : "+body.conditions[index].id);
                var finalDiseaseId=body.conditions[index].id;
                global.finalDiseaseId=finalDiseaseId;
                console.log("Probability of disease : "+body.conditions[index].probability);
                var finalProbability=body.conditions[index].probability;
                var probability=(finalProbability*100);
                global.probability=probability;
                console.log("Alexa will say : "+probability+" %");

                global.followUpCounter=1;
                global.yesFlag=0;
                sayFinalDiagnosis(intent, session, callback);//GOES TO SAY FINAL DIAGNOSIS
                //buildSpeechletResponse sends to uppermost block for ssml response processing
                //callback sends it back*/
            }
            else if(flag==0)
            {
                console.log("CONTINUE TO ASK QUESTIONS");
                console.log(body);
                var followUpQuestion=body.question.text;
                console.log("Follow Up Question Type : "+body.question.type);
                var followUpQuestionType=body.question.type;
                console.log("Follow Up Question : "+followUpQuestion);
                console.log("Follow Up Question ID : "+body.question.items[0].id);
                var followUpSymptomId=body.question.items[0].id;
                global.followUpSymptomId=followUpSymptomId;
                console.log("New Single Id to Push : "+global.followUpSymptomId);
                console.log("Follow Up Question Symptom Lookup Name : "+body.question.items[0].name);

                const sessionAttributes = {};
                const cardTitle = 'Follow Up for Diagnosis Triggered!';
                const speechOutput = `<speak>${followUpQuestion}</speak>`;
                const repromptText = '<speak>Are you there? Speak up.</speak>';
                const shouldEndSession = false;
                //':ask' mode

                global.followUpCounter=1;
                global.yesFlag=0;
                callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
                //buildSpeechletResponse sends to uppermost block for ssml response processing
                //callback sends it back*/
            }

        }//FOR SINGLE TYPE QUESTIONS PROCESSING

        else if(body.question.type==='group_single')
        {
          console.log("GROUP SINGLE TYPE HIT");
          console.log(body);
          global.body=body;

          processGroupDiagnosis(intent, session, callback);
        }//FOR GROUP TYPE QUESTIONS PROCESSING

        else if(body.question.type==='group_multiple')
        {
          console.log("GROUP MULTIPLE TYPE HIT");
          console.log(body);
          global.body=body;

          processGroupDiagnosis(intent, session, callback);
        }//FOR GROUP TYPE QUESTIONS PROCESSING


      });
}

function processGroupDiagnosis(intent, session, callback){
    console.log("GROUP DIAGNOSIS FUNCTION TRIGGERED");

      //console.log(body);
      console.log(global.body.question.type);//group_multiple

      console.log(global.body.question.text);//The followUp Question
      var groupText=global.body.question.text;
      console.log(global.body.question.items.length);
      var groupTypeBodyLength=global.body.question.items.length;

      global.groupIndex=0;
      var i=0;
      var speakCounter=0;
      for(i=0;i<groupTypeBodyLength;i++)
      {
          speakCounter++;
      }
      console.log("Asking Question Number : "+speakCounter);
      console.log(global.body.question.items[global.groupIndex].name);
      var firstInitiateGroupFollowUpName=global.body.question.items[global.groupIndex].name;
      console.log(global.body.question.items[global.groupIndex].id);
      var firstInitiateGroupFollowUpId=global.body.question.items[global.groupIndex].id;
      global.followUpSymptomId=firstInitiateGroupFollowUpId;
      console.log("New Group Id to Push : "+global.followUpSymptomId);
      global.groupIndex++;

      //Speak Out var groupText; That is the question : "How bad is the pain? Is it + "SEVERE"? "
      const sessionAttributes = {};
      const cardTitle = 'Follow Up for Diagnosis Triggered!';
      const speechOutput = `<speak>${groupText}. Would you say ${firstInitiateGroupFollowUpName}</speak>`;
      const repromptText = '<speak>Are you there? Speak up.</speak>';
      const shouldEndSession = false;
      global.followUpCounter=1;
      global.yesFlag=0;
      callback(sessionAttributes,buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
      //speak out the First Group Follow Up
};



function sayFinalDiagnosis(intent, session, callback){
    console.log("FINAL DIAGNOSED INTENT TRIGGERED");

    var buildURL='https://api.infermedica.com/v2/conditions/'+  global.finalDiseaseId;
    console.log("URL Built : "+buildURL);
    var options = { method: 'GET',
    url: buildURL,
    headers:
    { 'postman-token': '20cd3cf6-7a8e-9e62-3405-9603fd782d59',
      'cache-control': 'no-cache',
      'app-id': 'a4aad43a',
      'app-key': 'cb656061c337e54678d8d75ce5a14fde',
      'content-type': 'application/json' } };

      request(options,function (error, response, body) {
        if (error) throw new Error(error);
        console.log(body);
        console.log(JSON.parse(body).name);
        var conditionNameResult=JSON.parse(body).name;
        console.log(JSON.parse(body).prevalence);
        var conditionPrevalenceResult=JSON.parse(body).prevalence;
        var conditionPrevalenceResult = conditionPrevalenceResult.charAt(0).toUpperCase() + conditionPrevalenceResult.slice(1);
        var conditionPrevalenceResult=conditionPrevalenceResult.replace(/_/g,' ');
        console.log(JSON.parse(body).acuteness);
        var conditionAcutenessResult=JSON.parse(body).acuteness;
        var conditionAcutenessResult = conditionAcutenessResult.charAt(0).toUpperCase() + conditionAcutenessResult.slice(1);
        var conditionAcutenessResult=conditionAcutenessResult.replace(/_/g,' ');
        console.log(JSON.parse(body).severity);
        var conditionSeverityResult=JSON.parse(body).severity;
        var conditionSeverityResult = conditionAcutenessResult.charAt(0).toUpperCase() + conditionAcutenessResult.slice(1);
        var conditionSeverityResult=conditionAcutenessResult.replace(/_/g,' ');
        console.log(JSON.parse(body).extras.hint);
        var conditionAdviceResult=JSON.parse(body).extras.hint;


        const sessionAttributes = {};
        const cardTitle = 'Conditions Inquiry Code is Found Triggered!';
        const speechOutput = `<speak>Based on the symptoms you have given,there is a chance that you may have ${global.finalDiseaseName}. That\'s just what I can figure out. ${conditionAdviceResult}. I\'ve also sent some more detailed information to your companion app.</speak>`;
        const repromptText = '<speak>Are you there? Speak up.</speak>';
        const shouldEndSession = true;

        const cardOutput = {
                              "type": "Standard",
                              "title": "Medical Diagnosis Details",
                              "text": `Condition Name : ${conditionNameResult}\nPrevalence : ${conditionPrevalenceResult}\nSeverity : ${conditionSeverityResult}\nAcuteness : ${conditionAcutenessResult}\n Advice : ${conditionAdviceResult}`
                            };
        //':ask' mode
        callback(sessionAttributes,buildSpeechletResponse(cardOutput, speechOutput, repromptText, shouldEndSession));
        //buildSpeechletResponse sends to uppermost block for ssml response processing
        //callback sends it back

        //console.log(body);


      });
  }




// ---------------------------------------------- Events --------------------------------------------------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}


/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;
    console.log("Intent : "+intent);
    console.log("Intent Name : "+intentName);
    //these variables save the current intent names

    // Dispatch to your skill's intent handlers
    if (intentName === 'HelloWorldIntent') {
        sayHelloWorld(intent, session, callback);
    }
    else if (intentName === 'ConditionInquiryIntent') {
        sayConditionInquiry(intent, session, callback);
    }
    else if (intentName === 'TriggerDiagnosisIntent') {
        sayTriggerDiagnosis(intent, session, callback);
    }
    else if (intentName === 'DiagnosisSexInputIntent') {
        sayDiagnosisSexInput(intent, session, callback);
    }
    else if (intentName === 'DiagnosisAgeInputIntent') {
        sayDiagnosisAgeInput(intent, session, callback);
    }
    else if (intentName === 'DiagnosisSymptomInputIntent') {
        saySymptom(intent, session, callback);
    }
    else if (intentName === 'SatisfactoryIntent') {
        saySatisfactory(intent, session, callback);
    }
    /*else if (intentName === 'AMAZON.NoIntent') {
        onFeedbackFalse(callback);
    }
    else if (intentName === 'AMAZON.YesIntent') {
        onFeedbackTrue(callback);
    }*/
    else if (intentName === 'AMAZON.YesIntent') {
        getYesResponse(intent, session, callback);
    }
    else if (intentName === 'AMAZON.NoIntent') {
        getNoResponse(intent, session, callback);
    }
    else if (intentName === 'AMAZON.HelpIntent') {
        getHelpResponse(callback);
    }
    else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    }
    else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}

//-------------------------------------------------------------------------------------------------------------------------------
exports.handler = (event, context, callback) => {

    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }

    } catch (err) {
        console.log("\n---------------------------------------------");
        console.log(err);
        console.log("\n--------------------------------------------\n");
        callback(err);
    }
};
