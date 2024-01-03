import { Note, NoteReader, NoteWriter, Rating } from "./types";

export class NoteService {
  reader: NoteReader;
  writer: NoteWriter;

  constructor(r: NoteReader, w: NoteWriter) {
    this.reader = r;
    this.writer = w;
  }

  static getEligibleNotesFromRatings = (
    oldEnoughRatings: Array<Rating>,
    minimumRatingsPerNote: number,
  ): Array<Note> => {
    const noteRatingsMap: Record<string, Note> = {};
    for (const rating of oldEnoughRatings) {
      const key = `${rating.postUrl}-${rating.creator}`;
      if (!noteRatingsMap[key]) {
        noteRatingsMap[key] = {
          postUrl: rating.postUrl,
          creator: rating.creator,
          ratings: [],
        };
      }
      noteRatingsMap[key].ratings!.push(rating.value);
    }
    const eligibleNotes = Object.values(noteRatingsMap).filter(
      (note) => note.ratings!.length >= minimumRatingsPerNote,
    );
    return eligibleNotes;
  };

  getNotesToFinalise = async (
    from: Date,
    to: Date,
    minimumRatingsPerNote: number,
  ): Promise<Array<Note>> => {
    const eligibleRatings = await this.reader.getRatings(from, to);
    const notesToFinalise = NoteService.getEligibleNotesFromRatings(
      eligibleRatings,
      minimumRatingsPerNote,
    );
    return notesToFinalise;
  };

  getNotes = async (postUrl: string): Promise<Array<Note>> => {
    const notes = await this.reader.getNotes(postUrl);
    return notes;
  };

  mintNote = async (postUrl: string, creator: string) => {
    const note = await this.reader.getNote(postUrl, creator);

    if (note.finalRating! == 0)
      throw new Error("mint failed: note isn't finalised!");

    return await this.writer.mintNote721({
      postUrl: postUrl,
      creator: creator,
      content: note.content,
    });
  };

  //Throw if doesn't exist
  getXNoteID = async (noteUrl: string) => {
    const XUrl = noteUrl.replace("twitter", "x");
    return await this.reader.getXNoteID({ url: noteUrl });
  };

  createXNoteMetadata = async (noteUrl: string, content: string) => {
    const XUrl = noteUrl.replace("twitter", "x");
    return await this.writer.createXNoteMetadata({
      url: XUrl,
      content: content,
    });
  };
}