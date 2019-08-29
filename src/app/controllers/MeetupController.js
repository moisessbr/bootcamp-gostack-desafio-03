import * as Yup from 'yup';
import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      banner: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fail' });
    }

    const parsedDate = parseISO(req.body.date);

    if (isBefore(parsedDate, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permited' });
    }

    const user_id = req.userId;

    const meetup = await Meetup.create({ ...req.body, user_id });

    return res.json(meetup);
  }

  async index(req, res) {
    const schema = Yup.object().shape({
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.query))) {
      return res.status(400).json({ error: 'validation date fail' });
    }

    const { page = 1, date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const parsedDate = parseISO(date);

    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
        },
      },
      order: ['date'],
      attributes: ['id', 'title', 'description', 'location', 'date', 'user_id'],
      limit: 10,
      offset: (page - 1) * 10,
      include: [
        {
          model: File,
          as: 'banner_id',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: User,
          as: 'organizer',
          attributes: ['name', 'email'],
        },
      ],
    });

    return res.status(200).json(meetups);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      banner: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fail' });
    }

    const meetupUpdate = await Meetup.findByPk(req.params.meetupId);

    if (!meetupUpdate) {
      return res
        .status(400)
        .json({ error: "Can't find a meetup with this id" });
    }

    const verifyBannerExists = await File.findByPk(req.body.banner);

    if (!verifyBannerExists) {
      return res.status(400).json({ error: 'Banner id is invalid' });
    }

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res
        .status(400)
        .json({ error: "You can't move event date to past" });
    }

    if (meetupUpdate.user_id !== req.userId) {
      return res.status(400).json({ error: 'You can just update your events' });
    }

    if (isBefore(meetupUpdate.date, new Date())) {
      return res.status(400).json({ error: "You can't edit past events" });
    }

    const meetupUpdated = await meetupUpdate.update(req.body);

    return res.json(meetupUpdated);
  }

  async delete(req, res) {
    const meetupDelete = await Meetup.findByPk(req.params.meetupId);

    if (!meetupDelete) {
      return res
        .status(400)
        .json({ error: "Can't find a meetup with this id" });
    }

    if (meetupDelete.user_id !== req.userId) {
      return res.status(400).json({ error: 'You can just delete your events' });
    }

    if (isBefore(meetupDelete.date, new Date())) {
      return res.status(400).json({ error: "You can't delete past events" });
    }

    await meetupDelete.destroy();

    return res.send();
  }
}

export default new MeetupController();
