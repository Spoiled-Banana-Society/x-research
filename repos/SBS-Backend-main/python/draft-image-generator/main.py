import os
import json
import uuid
from PIL import Image, ImageFont, ImageDraw
from google.cloud import storage, logging

client = logging.Client()

client.setup_logging()

# download files from google storage
def download_blob(source_blob_name, final_file_name):
    """download a file to the bucket."""
    try:
        destination_file_name = f'/tmp/{final_file_name}'
        storage_client = storage.Client()
        bucket = storage_client.get_bucket('sbs-fantasy-prod-draft-token-images')

        blob = bucket.blob(source_blob_name)

        blob.download_to_filename(destination_file_name)
        print(
            f"File {destination_file_name} downloaded to {source_blob_name}."
        )
        return destination_file_name
    except Exception as e:
        print('Something went wrong...' + str(e))
        return None

# upload files to google storage
def upload_blob(source_file_name, destination_blob_name):
    """Uploads a file to the bucket."""
    # The ID of your GCS bucket
    bucket_name = 'sbs-fantasy-prod-draft-token-images'
    # The path to your file to upload
    # source_file_name = os.getcwd() + "/sbs_final_iamges/"
    # The ID of your GCS object
    # destination_blob_name = "storage-object-name"

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(source_file_name)

    print(
        f"File {source_file_name} uploaded to {destination_blob_name}."
    )

# create the card and upload to google storage
def create_card(card, token_id, level, uuidFour):

# 604
    horizontal = 585
    start_vertical = 226
    offsets = [0,0,0,0,0,0,2,2,2,5,3,3,6,10]
    if level == 'Pro':
        download_blob('front_draft_regular.png','file_import.png')
        sbs_image = Image.open('/tmp/file_import.png')
        font_color = (255,255,255)
    elif level == 'Hall of Fame':
        # will need to change this to the playoff image for HOF playoff cards
        download_blob('HOF_FRONT_PROD.png','file_import.png')
        sbs_image = Image.open('/tmp/file_import.png')
        font_color = (0, 0, 0)
    elif level == 'Jackpot':
        # will need to change this to the playoff image for HOF playoff cards
        download_blob('front_draft_jackpot_lg.png','file_import.png')
        sbs_image = Image.open('/tmp/file_import.png')
        font_color = (0, 0, 0)
    else:
        download_blob('front_draft_regular.png','file_import.png')
        sbs_image = Image.open('/tmp/file_import.png')
        font_color = (255,255,255)
      
    download_blob('Gogh-ExtraBoldItalic.otf','Gogh-ExtraBoldItalic.otf') 
    font = ImageFont.truetype('/tmp/Gogh-ExtraBoldItalic.otf', 74)
    draw = ImageDraw.Draw(sbs_image)
    indexOffset = [336, 448, 561, 671, 784, 896, 1006, 1116, 1226, 1338, 1448, 1558, 1668, 1776]
    playersAdded = 0

    for team in card['roster']['QB']:
        if playersAdded == 0:
            draw.text((horizontal, start_vertical), team['displayName'] , font_color, font=font)
        else:
            draw.text((horizontal, indexOffset[playersAdded - 1] + offsets[playersAdded - 1]), team['displayName'] , font_color, font=font)
        playersAdded = playersAdded + 1
        
    print(playersAdded)
    for team in card['roster']['RB']:
        draw.text((horizontal, indexOffset[playersAdded - 1] + offsets[playersAdded - 1]), team['displayName'] , font_color, font=font)
        playersAdded = playersAdded + 1
        
    print(playersAdded)
    for team in card['roster']['WR']:
        draw.text((horizontal, indexOffset[playersAdded - 1] + offsets[playersAdded - 1]), team['displayName'] , font_color, font=font)
        playersAdded = playersAdded + 1

    print(playersAdded)
    for team in card['roster']['TE']:
        draw.text((horizontal, indexOffset[playersAdded - 1] + offsets[playersAdded - 1]), team['displayName'] , font_color, font=font)
        playersAdded = playersAdded + 1

    print(playersAdded)
    for team in card['roster']['DST']:
        draw.text((horizontal, indexOffset[playersAdded - 1] + offsets[playersAdded - 1]), team['displayName'] , font_color, font=font)
        playersAdded = playersAdded + 1

    print(playersAdded)
    card_file_name = str(token_id) + '-' + uuidFour + '.png' 
    sbs_image.save('/tmp/' + card_file_name)
    upload_blob('/tmp/'+ card_file_name, card_file_name)
    os.remove('/tmp/' + card_file_name)
    os.remove('/tmp/Gogh-ExtraBoldItalic.otf')


# main function
def generateImage(request):
    """Responds to any HTTP request.
    Args:
        request (flask.Request): HTTP request object.
    Returns:
        The response text or any set of values that can be turned into a
        Response object using
        `make_response <http://flask.pocoo.org/docs/1.0/api/#flask.Flask.make_response>`.
    """
      
    card_test = {
        "roster": {
            "DST": [
                "CIN",
                "MIA"
            ],
            "QB": [
                "CLE",
                "HOU"
            ],
            "RB": [
                "DET",
                "LAR",
                "MIA",
                "SEA"
            ],
            "TE": [
                "HOU",
                "LAR"
            ],
            "WR": [
                "ATL",
                "IND",
                "KC",
                "NE",
                "SEA"
            ],
        },
        "_cardId": "420",
        "_level": "Pro",
        "_draftType": "live",
        "_leagueId": "live-draft-46",
        "_leagueDisplayName": "Draft League 46",
        "_rank": "N/A",
        "_weekScore": 0,
        "_seasonScore": 0,
        "_ownerId": "0x2f9c2123652cff3717fbd8edb1b256f16e9e4b80",
    }        
    request_json = request.get_json()
    
    if request_json and 'card' in request_json:
        card = request_json['card']
        print(card)
        #logging.log("Card: %s", )

        #traits = attribute_prep(card)
        uuidFour = str(uuid.uuid4().hex)
        create_card(card, card['_cardId'], card['_level'], uuidFour)
        card['_imageUrl'] = f'https://storage.googleapis.com/sbs-fantasy-prod-draft-token-images/thumbnails/{card["_cardId"]}-{uuidFour}_350x490.png'
        return (card, 200)
    else:    
        return f'did not work!'