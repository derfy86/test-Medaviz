/**
 * @module SmsConsumer
 */

 const accountSid = process.env.TWILIO_SID;
 const authToken = process.env.TWILIO_AUTH_TOKEN;
 const client = require('twilio')(accountSid, authToken);
 const amqp = require('amqplib/callback_api');

 const SmsConsumer = {
    execute: async (req, res, next) => {
        /**
         * We connect the RabbitMQ server, then we check the list of sms waiting to send
         * Doc: https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html
         */
        try {
            amqp.connect(process.env.RABBITMQ_URL, function(error, connection) {
                if (error) {
                    throw error;
                }
                connection.createChannel(function(error1, channel) {
                    if (error1) {
                        throw error1;
                    }
             
                    const queue = 'my list';
             
                    channel.assertQueue(queue, {
                        durable: false
                    });
             
                    console.log('SMS - Starting consumer from %s', queue);
             
                    channel.consume(queue, function(sms) {
                        console.log('Received %s', sms.content.toString());
                        
                        /** 
                         * Cheking the sms values
                         */
                        SmsConsumer.checkValues(sms);
                   
                        /**
                         * Now we try to send the sms with twilio, after the third failure we stop the loop
                         */
                        SmsConsumer.trySendMessage(sms);
                     
                    }, {
                        noAck: true
                    });
                });
             });
          
        }
        catch (error) {
            console.error(error);
            return res.status(500);
        }
        next();
    },

    /** 
     * Function check sms values
     */
    checkValues: (sms) => {
        if(sms.content || sms.from || sms.to === undefined){
            return console.log('Some sms values missed');
        };
        const validateNumber = /^(\([0-9]{3}\) |[0-9]{3}-)[0-9]{3}-[0-9]{4}/;
        if(sms.from || sms.to !== validateNumber){
            return console.log('Wrong phone number');
        }
    },

    /**
     * Function used for sending the sms with twilio
     * Doc: https://www.twilio.com/fr/docs/sms/quickstart/node
     */
    trySendMessage: async(sms) => {
        for (const tryToSend = 0; tryToSend < 3; tryToSend ++){
            try {
                await client.messages.create({
                    body: sms.content.toString(),
                    from: sms.from,
                    to:  sms.to
                });
                break;

            } catch (e) {
                tryToSend < 3 ? console.error(e, 'SMS - Exception requeue') : console.error(e, 'SMS - Ack after third failure');
                tryToSend++;
            }
        }
    }
}

module.exports = SmsConsumer;