export function shuffle<T>(array: Array<T>) {
    const clone = [...array]
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [clone[currentIndex], clone[randomIndex]] = [
        clone[randomIndex], clone[currentIndex]];
    }
  
    return clone;
}
