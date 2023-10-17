import { logger } from "./logging";
import { createFactCheckProvider } from "./web3";

const provider = createFactCheckProvider();
const contract = await provider.getContract();


const notify = (title, content, postUrl) => {
  logger.log("Requestion notification");
  chrome.runtime.sendMessage({
    type: 'fc-notify',
    postUrl,
    title,
    content,
  });
};

contract.on("NoteCreated", async (postUrl, creator, stake, event) => {
  logger.log("New note created", event);
  const address = await provider.getAddress();
  if (address.toLowerCase() === creator.toLowerCase()) {
    notify("New note", `🚀 Your note was successfuly created!`, postUrl);
  } else {
    logger.log(`Not a notification for address ${address}`);
  }
});

contract.on("NoteRated", async (postUrl, creator, rater, rating, stake, event) => {
  logger.log("New note rated", event);
  const address = (await provider.getAddress()).toLowerCase();
  if (address === rater.toLowerCase()) {
    notify("New rating", `🚀 Your rating was sucessfuly registered!`, postUrl);
  } else {
    logger.log(`Not a notification for address ${address}`);
  }
});

contract.on("RaterRewarded", async (postUrl, creator, rater, reward, stake, event) => {
  logger.log("New rating reward", event);
  const address = (await provider.getAddress()).toLowerCase();
  if (address === rater.toLowerCase()) {
    notify("Rating reward", `🤑 Rewarded ${reward} wei for your rating!`, postUrl);
  } else {
    logger.log(`Not a notification for address ${address}`);
  }
});

contract.on("RaterSlashed", async (postUrl, creator, rater, slash, stake, event) => {
  logger.log("New rating slash", event);
  const address = (await provider.getAddress()).toLowerCase();
  if (address === rater.toLowerCase()) {
    notify("Rating slash", `😔 Slashed ${slash} wei for your rating...`, postUrl);
  } else {
    logger.log(`Not a notification for address ${address}`);
  }
});

contract.on("CreatorRewarded", async (postUrl, creator, reward, stake, event) => {
  logger.log("New note reward", event);
  const address = (await provider.getAddress()).toLowerCase();
  if (address === creator.toLowerCase()) {
    notify("Note reward", `🤑 Rewarded ${reward} wei for your note!`, postUrl);
  } else {
    logger.log(`Not a notification for address ${address}`);
  }
});

contract.on("CreatorSlashed", async (postUrl, creator, slash, stake, event) => {
  logger.log("New note slash", event);
  const address = (await provider.getAddress()).toLowerCase();
  if (address === creator.toLowerCase()) {
    notify("Note slash", `😔 Slashed ${slash} wei for your note...`, postUrl);
  } else {
    logger.log(`Not a notification for address ${address}`);
  }
});

logger.log("Listening to contract events");