const assert = require('assert');
const EmailEventProcessor = require('../lib/email-event-processor');
const {createDb} = require('./utils');
const sinon = require('sinon');

describe('Email Event Processor', function () {
    let eventProcessor;
    let db;
    let domainEvents;

    beforeEach(function () {
        db = createDb({first: {
            emailId: 'fetched-email-id',
            member_id: 'member-id',
            id: 'email-recipient-id'
        }});

        domainEvents = {
            dispatch: sinon.stub()
        };
        eventProcessor = new EmailEventProcessor({
            db,
            domainEvents
        });
    });

    afterEach(function () {
        sinon.restore();
    });

    describe('getEmailId', function () {
        let reuseProcessor;

        it('Fetches from database', async function () {
            const emailId = await eventProcessor.getEmailId('provider-id');
            assert.equal(emailId, 'fetched-email-id');
            reuseProcessor = eventProcessor;
        });
        it('Returns from memory', async function () {
            sinon.stub(db, 'first').rejects('Should not be called');
            const emailId = await reuseProcessor.getEmailId('provider-id');
            assert.equal(emailId, 'fetched-email-id');
        });
    });

    describe('getRecipient', function () {
        it('Returns undefined if both providerId and emailId are missing', async function () {
            const recipient = await eventProcessor.getRecipient({});
            assert.strictEqual(recipient, undefined);
        });

        it('Uses emailId to query recipient', async function () {
            const recipient = await eventProcessor.getRecipient({emailId: 'my-id', email: 'example@example.com'});
            assert.deepEqual(recipient, {
                emailRecipientId: 'email-recipient-id',
                memberId: 'member-id',
                emailId: 'my-id'
            });
        });

        it('Uses providerId to query recipient', async function () {
            const recipient = await eventProcessor.getRecipient({providerId: 'provider-id', email: 'example@example.com'});
            assert.deepEqual(recipient, {
                emailRecipientId: 'email-recipient-id',
                memberId: 'member-id',
                emailId: 'fetched-email-id'
            });
        });

        it('Returns undefined if no email found for provider', async function () {
            sinon.stub(db, 'first').resolves(null);
            const recipient = await eventProcessor.getRecipient({providerId: 'provider-id', email: 'example@example.com'});
            assert.strictEqual(recipient, undefined);
        });

        it('Returns undefined if no recipient found for email', async function () {
            sinon.stub(db, 'first').resolves(null);
            const recipient = await eventProcessor.getRecipient({emailId: 'email-id', email: 'example@example.com'});
            assert.strictEqual(recipient, undefined);
        });
    });

    describe('handle events', function () {
        it('handleDelivered', async function () {
            const recipient = await eventProcessor.handleDelivered({emailId: 'email-id', email: 'example@example.com'}, new Date());
            assert.deepEqual(recipient, {
                emailRecipientId: 'email-recipient-id',
                memberId: 'member-id',
                emailId: 'email-id'
            });
            assert.equal(domainEvents.dispatch.callCount, 1);
            const event = domainEvents.dispatch.firstCall.args[0];
            assert.equal(event.email, 'example@example.com');
            assert.equal(event.constructor.name, 'EmailDeliveredEvent');
        });

        it('handleOpened', async function () {
            const recipient = await eventProcessor.handleOpened({emailId: 'email-id', email: 'example@example.com'}, new Date());
            assert.deepEqual(recipient, {
                emailRecipientId: 'email-recipient-id',
                memberId: 'member-id',
                emailId: 'email-id'
            });
            assert.equal(domainEvents.dispatch.callCount, 1);
            const event = domainEvents.dispatch.firstCall.args[0];
            assert.equal(event.email, 'example@example.com');
            assert.equal(event.constructor.name, 'EmailOpenedEvent');
        });

        it('handleTemporaryFailed', async function () {
            const recipient = await eventProcessor.handleTemporaryFailed({emailId: 'email-id', email: 'example@example.com'}, new Date());
            assert.deepEqual(recipient, {
                emailRecipientId: 'email-recipient-id',
                memberId: 'member-id',
                emailId: 'email-id'
            });
            assert.equal(domainEvents.dispatch.callCount, 1);
            const event = domainEvents.dispatch.firstCall.args[0];
            assert.equal(event.email, 'example@example.com');
            assert.equal(event.constructor.name, 'EmailTemporaryBouncedEvent');
        });

        it('handlePermanentFailed', async function () {
            const recipient = await eventProcessor.handlePermanentFailed({emailId: 'email-id', email: 'example@example.com'}, new Date());
            assert.deepEqual(recipient, {
                emailRecipientId: 'email-recipient-id',
                memberId: 'member-id',
                emailId: 'email-id'
            });
            assert.equal(domainEvents.dispatch.callCount, 1);
            const event = domainEvents.dispatch.firstCall.args[0];
            assert.equal(event.email, 'example@example.com');
            assert.equal(event.constructor.name, 'EmailBouncedEvent');
        });

        it('handleUnsubscribed', async function () {
            const recipient = await eventProcessor.handleUnsubscribed({emailId: 'email-id', email: 'example@example.com'}, new Date());
            assert.deepEqual(recipient, {
                emailRecipientId: 'email-recipient-id',
                memberId: 'member-id',
                emailId: 'email-id'
            });
            assert.equal(domainEvents.dispatch.callCount, 1);
            const event = domainEvents.dispatch.firstCall.args[0];
            assert.equal(event.email, 'example@example.com');
            assert.equal(event.constructor.name, 'EmailUnsubscribedEvent');
        });

        it('handleComplained', async function () {
            const recipient = await eventProcessor.handleComplained({emailId: 'email-id', email: 'example@example.com'}, new Date());
            assert.deepEqual(recipient, {
                emailRecipientId: 'email-recipient-id',
                memberId: 'member-id',
                emailId: 'email-id'
            });
            assert.equal(domainEvents.dispatch.callCount, 1);
            const event = domainEvents.dispatch.firstCall.args[0];
            assert.equal(event.email, 'example@example.com');
            assert.equal(event.constructor.name, 'SpamComplaintEvent');
        });
    });
});
