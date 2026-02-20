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

  prereveal_metadata = {"name": "Banana Best Ball Draft Tokens", "attributes": [{}], "image": "https://storage.googleapis.com/sbs-fantasy-prod-draft-token-images/thumbnails/draft-token-image_350x490.png", "description": "Banana Best Ball Draft Token"}

  from google.cloud import firestore

  if request.path:
    token_id = request.path[1:]
    print(f'token id {token_id}')

  if token_id:
    db = firestore.Client()
      
    metadata_doc = db.collection(u'draftTokenMetadata').document(str(token_id))
    metadata_doc = metadata_doc.get()
    meta = metadata_doc.to_dict()
    print(meta)
        
    if meta is not None:
      print(meta["Description"])
      print(meta["Attributes"])
      arr = []
      attributes = meta['Attributes']
      for obj in attributes:
        trait = {}
        trait["trait_type"] = obj["Trait_Type"]
        trait["value"] = obj["Value"]
        arr.append(trait)

      result = {}
      result["description"] = meta["Description"]
      result["image"] = meta["Image"]
      result["name"] = meta["Name"]
      result["attributes"] = arr
      print("returning card from database")
      print(result)
      return result
    else:    
      print("returning preveal metadata")        
      return prereveal_metadata
  else:
    return "base route for Banana Best Ball Draft Token Metadata server"