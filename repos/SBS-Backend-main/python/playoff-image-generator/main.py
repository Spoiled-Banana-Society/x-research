import os
import json
import uuid
from PIL import Image, ImageFont, ImageDraw
from google.cloud import storage

# download files from google storage
def download_blob(source_blob_name, final_file_name):
    """download a file to the bucket."""
    try:
        destination_file_name = f'/tmp/{final_file_name}'
        storage_client = storage.Client()
        bucket = storage_client.get_bucket('sbs-fantasy-prod-playoff-card-images')

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
    bucket_name = 'sbs-fantasy-prod-playoff-card-images'
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
def create_card(traits, token_id, level, uuidFour):

# 604
    horizontal = 585
    start_vertical = 226
    offsets = [0,0,0,0,0,0,2,2,2,5,3,3,6,10]
    if level == 'Pro':
        # will need to change this to the playoff image for pro cards
        download_blob('PRO_FRONT_PROD.png','file_import.png')
        sbs_image = Image.open('/tmp/file_import.png')
        font_color = (213,178,82)
    else:
        # will need to change this to the playoff image for HOF playoff cards
        download_blob('HOF_FRONT_PROD.png','file_import.png')
        sbs_image = Image.open('/tmp/file_import.png')
        font_color = (0, 0, 0)
      
    download_blob('Gogh-ExtraBoldItalic.otf','Gogh-ExtraBoldItalic.otf') 
    font = ImageFont.truetype('/tmp/Gogh-ExtraBoldItalic.otf', 74)
    draw = ImageDraw.Draw(sbs_image)
    draw.text((horizontal, start_vertical), traits['QB1'] + ' QB', font_color, font=font)
    draw.text((horizontal, 336 + offsets[0]), traits['QB2'] + ' QB', font_color, font=font)
    draw.text((horizontal, 448 + offsets[1]), traits['RB1'] + ' RB', font_color, font=font)
    draw.text((horizontal, 561 + offsets[2]), traits['RB2'] + ' RB', font_color, font=font)
    draw.text((horizontal, 671 + offsets[3]), traits['RB3'] + ' RB', font_color, font=font)
    draw.text((horizontal, 784 + offsets[4]), traits['RB4'] + ' RB', font_color, font=font)
    draw.text((horizontal, 896 + offsets[5]), traits['WR1'] + ' WR',  font_color, font=font)
    draw.text((horizontal, 1006 + offsets[6]), traits['WR2'] + ' WR', font_color, font=font)
    draw.text((horizontal, 1116 + offsets[7]), traits['WR3'] + ' WR', font_color, font=font)
    draw.text((horizontal, 1226 + offsets[8]), traits['WR4'] + ' WR', font_color, font=font)
    draw.text((horizontal, 1338 + offsets[9]), traits['WR5'] + ' WR', font_color, font=font)
    draw.text((horizontal, 1448 + offsets[10]), traits['TE1'] + ' TE', font_color, font=font)
    draw.text((horizontal, 1558 + offsets[11]), traits['TE2'] + '  TE', font_color, font=font)
    draw.text((horizontal, 1668 + offsets[12]), traits['DST1'] + ' DST',  font_color, font=font)
    draw.text((horizontal, 1776 + offsets[13]), traits['DST2'] + ' DST', font_color, font=font)

    card_file_name = str(token_id) + '-' + uuidFour + '.png' 
    sbs_image.save('/tmp/' + card_file_name)
    upload_blob('/tmp/'+ card_file_name, card_file_name)
    os.remove('/tmp/' + card_file_name)
    os.remove('/tmp/Gogh-ExtraBoldItalic.otf')

# prepare attributes for card creation
def attribute_prep(card):
    final_traits = {}
    level = ''
    for t_type, traits in card.items():
       
        if isinstance(traits, list):
            for i, trait in enumerate(traits):
                trait_name = t_type + str(i+1)
                final_traits[trait_name] = trait
           
    return final_traits

# main function
def peelmash(request):
    """Responds to any HTTP request.
    Args:
        request (flask.Request): HTTP request object.
    Returns:
        The response text or any set of values that can be turned into a
        Response object using
        `make_response <http://flask.pocoo.org/docs/1.0/api/#flask.Flask.make_response>`.
    """
      
    card_test = {
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
        "_cardId": "1291",
        "_freePeel": 1,
        "_level": "Pro",
        "_ownerId": "0x007F7205e2eC1d90CF61C8bf65B23712bFDAE4FD",
        "_teamHash": "QB:CLE,HOU|RB:DET,LAR,MIA,SEA|WR:ATL,IND,KC,NE,SEA|TE:HOU,LAR|DST:CIN,MIA"
    }        
    request_json = request.get_json()
    
    if request_json and 'card' in request_json:
        card = request_json['card']

        traits = attribute_prep(card)
        uuidFour = str(uuid.uuid4().hex)
        create_card(traits, card['_cardId'], card['_level'], uuidFour)
        card['_imageUrl'] = f'https://storage.googleapis.com/sbs-fantasy-prod-playoff-card-images/thumbnails/{card["_cardId"]}-{uuidFour}_350x490.png'
        return (card, 200)
    else:    
        return f'did not work!'
