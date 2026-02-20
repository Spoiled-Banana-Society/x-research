import csv

if __name__ == "__main__":
    shortened = []
    with open("genesisRewards.csv") as f:
        reader = csv.reader(f)

        for row in reader:
            if row[1] == "owner":
                continue
            if float(row[2]) > 0:
                shortened.append(row)
    
    with open("genesisRewardsShort.csv", 'w') as f:
        writer = csv.writer(f)

        writer.writerow(('token_type', 'owner', 'amount', 'cardId'))
        for row in shortened:
            writer.writerow(row)
