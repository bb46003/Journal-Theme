export class SocketHandler {
  constructor() {
    this.identifier = "module.journal-styler";
    this.registerSocketEvents();
  }
  registerSocketEvents() {
    game.socket.on(this.identifier, async (data) => {
      switch (data.type) {
        case "setFlag":
            if(game.user.isGM){
                const journalEntry = await fromUuid(data.journalUuid);
                await journalEntry.update(data.updateData);
            }
            break
      }
    })
}
  emit(data) {
    return game.socket.emit(this.identifier, data);
  }
}