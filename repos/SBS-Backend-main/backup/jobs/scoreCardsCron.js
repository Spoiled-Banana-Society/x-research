import utils from "../services/utils.js";
import db from "../services/db.js";

(async () => {


    const year = new Date().getFullYear();
    const season = utils.getNFLSeason(year);
    const week = 2 //await utils.getNFLWeek(season);
    const nflWeekStr = `${year}-${season}-week-${week}`;
    const fantasyScoreByNftTeam = await db.readDocument("fantasyScoreByNFLTeam", nflWeekStr);
    const stats = fantasyScoreByNftTeam.FantasyPoints;

    //Select tokens to score (expensive query here.  Use with caution)
    //const cardIds = await db.readAllDocumentIds('cardTest');
    const cardIds = await db.readAllDocumentIds('cards');

    let card;
    let updatedCard;
    let startingLineup;
    let team;
    let position;
    let pts;
    let totalWeeklyPoints = 0;
    let prevSeasonPts;

    for (let i = 0; i < cardIds.length; i++) {
        
        card  = await db.readDocument("cards", cardIds[i]);
        updatedCard = card;
        startingLineup = card.startingLineup;
        updatedCard[nflWeekStr] = {};
        updatedCard[nflWeekStr].startingLineup = [];

        startingLineup.forEach(player => {
            team = player.teamId;
            position = player.positionId;
            pts = utils.getFantasyPointsFromStats(stats, team, position)
    
            updatedCard[nflWeekStr].startingLineup.push({
                positionId: player.positionId,
                positionLabel: player.positionLabel,
                starting: player.starting,
                teamId: player.teamId,
                teamPostion: player.teamPostion,
                pts: pts.toFixed(2)
            });
    
            if(player.starting) totalWeeklyPoints += pts;
        });

        updatedCard[nflWeekStr].weekPts = totalWeeklyPoints.toFixed(2);

        

        updatedCard[nflWeekStr].seasonPts = prevSeasonPts + totalWeeklyPoints;

        console.log(updatedCard);

        //await db.updateDocument("teams", cardIds[i], updatedCard);
        totalWeeklyPoints = 0;
    }

    process.exit(0);
})();
