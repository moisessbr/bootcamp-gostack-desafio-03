import * as Yup from 'yup';
import { isBefore, format } from 'date-fns';
import { Op } from 'sequelize';
import pt from 'date-fns/locale/pt';
import Subscribe from '../models/Subscribe';
import Meetup from '../models/Meetup';
import Queue from '../../lib/Queue';
import SubscribeMail from '../jobs/SubscribeMail';
import User from '../models/User';

class SubscribeController {
  async store(req, res) {
    const schema = Yup.object().shape({
      meetup_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fail' });
    }

    const meetup = await Meetup.findByPk(req.body.meetup_id);

    if (!meetup) {
      return res.status(400).json({ error: "Can't find a event with this id" });
    }

    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: 'You can not sign up for your own event.' });
    }

    if (isBefore(meetup.date, new Date())) {
      return res
        .status(400)
        .json({ error: "You can't sign up in a past event" });
    }

    const checkDoubledSubscription = await Subscribe.findOne({
      where: {
        user_id: req.userId,
        meetup_id: req.body.meetup_id,
      },
    });

    if (checkDoubledSubscription) {
      return res
        .status(400)
        .json({ error: 'You already signed up for this event' });
    }

    // Check Overlap Events

    const checkDateEvents = await Meetup.findAll({
      where: {
        date: meetup.date,
      },
    });

    const checkMeetupIds = [];

    checkDateEvents.map(check => checkMeetupIds.push(check.id));

    const checkOverlapDates = await Subscribe.findOne({
      where: {
        user_id: req.userId,
        meetup_id: checkMeetupIds,
      },
    });

    if (checkOverlapDates) {
      return res.status(400).json({
        error: 'You are already registered for another event at the same time',
      });
    }

    const user_id = req.userId;

    const subscription = await Subscribe.create({ ...req.body, user_id });

    const organizer = await User.findOne({
      where: {
        id: meetup.user_id,
      },
    });

    const subscriber = await User.findOne({
      where: {
        id: user_id,
      },
    });

    await Queue.add(SubscribeMail.key, {
      organizer,
      subscriber,
      meetup,
    });

    return res.json(subscription);
  }

  async index(req, res) {
    const user_id = req.userId;

    const subscriptions = await Subscribe.findAll({
      where: {
        user_id,
      },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          attributes: ['title', 'description', 'location', 'date'],
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.status(200).json(subscriptions);
  }

  async delete(req, res) {
    const subscribeDelete = await Subscribe.findByPk(req.params.subscribeId);

    if (!subscribeDelete) {
      return res
        .status(400)
        .json({ error: "Can't find a subscription with this id" });
    }

    if (subscribeDelete.user_id !== req.userId) {
      return res
        .status(400)
        .json({ error: 'You can just delete your subscriptions' });
    }

    const subscribeDeletePast = await Meetup.findByPk(
      subscribeDelete.meetup_id
    );

    if (isBefore(subscribeDeletePast.date, new Date())) {
      return res
        .status(400)
        .json({ error: "You can't delete past subscriptions" });
    }

    await subscribeDelete.destroy();

    return res.send();
  }
}

export default new SubscribeController();
