import json

def metadata(request):
    """Responds to any HTTP request.
    Args:
        request (flask.Request): HTTP request object.
    Returns:
        The response text or any set of values that can be turned into a
        Response object using
        `make_response <http://flask.pocoo.org/docs/1.0/api/#flask.Flask.make_response>`.
    """
    ## Set CORS headers for the preflight request
    if request.method == 'OPTIONS':
        ## Allows GET requests from any origin with the Content-Type
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }

        return ('', 204, headers)

    # Set CORS headers for the main request
    headers = {
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Allow-Origin': '*'
    }

    prereveal_metadata = {"name": "Spoiled Banana Society Playoffs Season #1", "attributes": [{}], "image": "https://storage.googleapis.com/sbs-fantasy-prod-playoff-card-images/thumbnails/HOF_BACK_350x490.png", "description": "Spoiled Banana Society Playoffs Season #1"}

    from google.cloud import firestore

    if request.path:
        token_id = request.path[1:]
        print(f'token id {token_id}')

    if token_id:
        db = firestore.Client()
        total_supply = 2500

        if int(token_id) < total_supply:        
            metadata_doc = db.collection(u'playoffCardMetadata').document(str(token_id))
            metadata_doc = metadata_doc.get()
            meta = metadata_doc.to_dict()
            
            return meta
        else:            
            return prereveal_metadata