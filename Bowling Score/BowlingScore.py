"""
This file contains the code to compute a standard bowling game

Scoring Methodology:
> Spare: 10 points + the number of pins you knock down for your first attempt at the next frame
> Strike: 10 points + 2 * number of pins you knock down for the entire next frame


Input: Scores, spare and strike symbols separated by commas and frames
Output: Total Score of the bowling match
"""

def validityDetection(scoreList):
    if len(scoreList.split('|')) != 10:
        return False
    for frameScore in scoreList.split('|'):
        scoring = frameScore.split(',')
        if len(scoring) == 1 and int(scoring[0]) > 10:
            return False
        elif len(scoring) == 2 and sum([int(i) for i in scoring]) > 10:
            return False
    
    # Final frame check
    finalFrame = scoreList.split('|')[0].split(',')
    if sum([int(i) for i in finalFrame]) > 30:
        return False
    elif sum([int(i) for i in finalFrame][1:]) > 20:
        return False
    elif [int(i) for i in finalFrame][0] > 10:
        return False
    return True


def computeScore(scores):
    for score in scores:
        if (validityDetection(score)) == False:
            print("Error in Bowling Score Card!!")
        else:
            # Initialise an empty scoring frame
            computedScoresByFrame = {
                0: None, 1: None, 2: None, 3: None, 4: None, 5: None, 6: None, 7: None, 8: None, 9: None
            }

            frameScoring = score.split('|')
            
            # Computing the first 9 frames
            for indx in range(0, len(frameScoring) - 1):
                frame = frameScoring[indx].split(',')
        
                # Strike
                if len(frame) == 1 and int(frame[0]) == 10:
                    
                    # If it is the first frame
                    if indx == 0:
                        computedScoresByFrame[indx] = {'Strike': 10}
                    else:
                        identity1 = list(computedScoresByFrame[indx - 1].keys())[0]
                        identity2 = None
                        if indx >= 2:
                            identity2 = list(computedScoresByFrame[indx - 2].keys())[0]
                        # If the previous frame is a spare, add 10 points to the previous frame
                        if identity1 == 'Spare':
                            computedScoresByFrame[indx - 1] = {'Spare': computedScoresByFrame[indx - 1][identity1] + 10}
                            computedScoresByFrame[indx] = {'Strike': 10}

                        # If the previous frame is a strike, add 10 points to the previous frame and add 10 to the current one
                        elif identity1 == 'Strike':
                            computedScoresByFrame[indx - 1] = {'Strike': computedScoresByFrame[indx - 1][identity1] + 10}
                            computedScoresByFrame[indx] = {'Strike': 10}
                        
                        # If the previous frame is neither a strike nor a spare
                        else:
                            computedScoresByFrame[indx] = {'Strike': 10}
                        
                        # If the previous previous frame is a spare, add 10 points to the previous previous frame
                        if identity2 == 'Spare':
                            computedScoresByFrame[indx - 2] = {'Spare': computedScoresByFrame[indx - 2][identity2] + 10}

                        # If the previous previous frame is a strike, add 10 points to the previous previous frame and add 10 to the current one
                        elif identity2 == 'Strike':
                            computedScoresByFrame[indx - 2] = {'Strike': computedScoresByFrame[indx - 2][identity2] + 10}
                        
                        # If previous previous frame is neither a strike nor a spare
                        else:
                            continue
                            
                # Spare
                elif len(frame) == 2 and sum([int(score) for score in frame]) == 10:
                    # If it is the first frame
                    if indx == 0:
                        computedScoresByFrame[indx] = {'Spare': 10}
                    else:
                        identity1 = list(computedScoresByFrame[indx - 1].keys())[0]
                        identity2 = None
                        if indx >= 2:
                            identity2 = list(computedScoresByFrame[indx - 2].keys())[0]

                        # If the previous frame is a spare, add 10 points to the previous frame
                        if identity1 == 'Spare':
                            computedScoresByFrame[indx - 1] = {'Spare': computedScoresByFrame[indx - 1][identity1] + 10}
                            computedScoresByFrame[indx] = {'Spare': 10}

                        # If the previous frame is a strike, add 10 points to the previous frame and add 10 to the current one
                        elif identity1 == 'Strike':
                            computedScoresByFrame[indx - 1] = {'Strike': computedScoresByFrame[indx - 1][identity1] + 10}
                            computedScoresByFrame[indx] = {'Spare': 10}

                        # If the previous frame is neither a strike nor a spare
                        else:
                            computedScoresByFrame[indx] = {'Spare': 10}

                        # If the previous previous frame is a spare, add 10 points to the previous previous frame
                        if identity2 == 'Spare':
                            computedScoresByFrame[indx - 2] = {'Spare': computedScoresByFrame[indx - 2][identity2] + 10}

                        # If the previous previous frame is a strike, add 10 points to the previous previous frame and add 10 to the current one
                        elif identity2 == 'Strike':
                            computedScoresByFrame[indx - 2] = {'Strike': computedScoresByFrame[indx - 2][identity2] + 10}
                        
                        # If previous previous frame is neither a strike nor a spare
                        else:
                            continue
                        

                # Normal shots
                else:
                    frameScores = [int(score) for score in frame]
                    if indx == 0:
                        computedScoresByFrame[indx] = {'Normal': sum(frameScores)}
                    else:
                        identity1 = list(computedScoresByFrame[indx - 1].keys())[0]
                        identity2 = None
                        if indx >= 2:
                            identity2 = list(computedScoresByFrame[indx - 2].keys())[0]

                        # If previous frame is a strike
                        if identity1 == 'Strike':
                            computedScoresByFrame[indx - 1] = {'Strike': computedScoresByFrame[indx - 1][identity1] + sum(frameScores)} 
                            computedScoresByFrame[indx] = {'Normal': sum(frameScores)}
                        
                        # If previous frame is a spare
                        elif identity1 == 'Spare':
                            computedScoresByFrame[indx - 1] = {'Spare': computedScoresByFrame[indx - 1][identity1] + frameScores[0]}
                            computedScoresByFrame[indx] = {'Normal': sum(frameScores)} 
                        
                        # If previous frame is neither a strike or a spare
                        else:
                            computedScoresByFrame[indx] = {'Normal': sum(frameScores)}
            
            # Computing the last frame
            lastFrame = frameScoring[-1].split(',')
            lastFrameScore = 0
            frame8AddedMax2, frame7Added = 0, False
            for score in [int(i) for i in lastFrame]:
                # If it is a strike
                if score == 10:
                    identity1 = list(computedScoresByFrame[8].keys())[0]       
                    identity2 = list(computedScoresByFrame[7].keys())[0]
                    # If previous frame is a strike, add 10 points to it
                    if identity1 == 'Strike' and frame8AddedMax2 <= 1:
                        computedScoresByFrame[8] = {'Strike': computedScoresByFrame[8]['Strike'] + 10}
                        frame8AddedMax2 += 1
                    # if previous previous frame is a strike, add 10 points to it
                    if identity2 == 'Strike' and frame7Added == False:
                        computedScoresByFrame[7] = {'Strike': computedScoresByFrame[7]['Strike'] + 10}
                        frame7Added = True 
                lastFrameScore += score
            computedScoresByFrame[9] = {None : lastFrameScore}
        
            totalScore = 0
            for frame, data in computedScoresByFrame.items():
                for nature, score in data.items():
                    totalScore += score
            # Print the final score
            print(totalScore)


if __name__ == "__main__":
    with open('scores.txt', 'r') as f:
        lines = f.readlines()
        scores = [line.strip() for line in lines]
    
    computeScore(scores)