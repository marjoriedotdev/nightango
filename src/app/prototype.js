import { SAMPLE_TIKTOK_THUMB, SAMPLE_X_POST, dmReply, sampleMedia, sampleVisits } from './sample-data.js';
import { Simulation } from './simulation.js';
import { prototypeActions } from './prototype-actions.js';
// -- Prototype backend --------------------------------------------------------

/**
 * What the hosted prototype hands the interface in place of BetterChatango: its sample world, media library, visits and posts, the replies of its members and its activity.
 * Only the hosted entry imports it: none of it ships in the userscript.
 */
export var PROTOTYPE = {
  media: sampleMedia,
  visitors: function (q) { return Promise.resolve(sampleVisits(q)); },
  /**
   * Reads a TikTok link: a post link shows the sample cover, a short link turns back into a link.
   * @param {{id: ?string, url: string}} e TikTok media of a message.
   */
  tiktokPost: function (e) {
    return e.id ? Promise.resolve({ post: e.id, link: e.url, thumb: SAMPLE_TIKTOK_THUMB })
      : Promise.reject(new Error("Short TikTok links aren't part of this prototype. Open the link instead."));
  },
  /**
   * Reads an X link: only the sample post has a card.
   * @param {{id: string, url: string}} e X media of a message.
   */
  xPost: function (e) {
    return e.id === SAMPLE_X_POST.id ? Promise.resolve(SAMPLE_X_POST.card)
      : Promise.reject(new Error('Only the sample X post is part of this prototype. Open the link instead.'));
  },
  dmReply: dmReply,
  actions: prototypeActions,
  Simulation: Simulation
};
