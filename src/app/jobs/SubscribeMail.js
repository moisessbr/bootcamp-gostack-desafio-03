import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class SubscribeMail {
  get key() {
    return 'SubscribeMail';
  }

  async handle({ data }) {
    const { organizer, meetup, subscriber } = data;
    await Mail.sendMail({
      to: `${organizer.name} <${organizer.email}>`,
      subject: `Novo participante no Meetup ${meetup.title}`,
      template: 'subscribe',
      context: {
        organizer: organizer.name,
        evento: meetup.title,
        date: format(parseISO(meetup.date), "'dia 'dd' de 'MMMM' às 'H:mm'h'", {
          locale: pt,
        }),
        inscrito: subscriber.name,
        emailInscrito: subscriber.email,
      },
    });
  }
}

export default new SubscribeMail();
