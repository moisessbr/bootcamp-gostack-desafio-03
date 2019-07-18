import Meetup from '../models/Meetup';
import File from '../models/File';

class OrganizedController {
  async index(req, res) {
    const user_id = req.userId;

    const meetups = await Meetup.findAll({
      where: { user_id },
      attributes: ['id', 'title', 'description', 'location', 'date'],
      include: [
        {
          model: File,
          as: 'banner_id',
          attributes: ['path', 'url'],
        },
      ],
    });

    return res.status(200).json(meetups);
  }
}
export default new OrganizedController();
