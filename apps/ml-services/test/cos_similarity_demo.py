#!/usr/bin/env python3
"""
Embedding Similarity Calculator

Usage:
    python similarity.py --text1 "A tree" --text2 "Green leaves"
    python similarity.py --image1 path/to/image1.jpg --image2 path/to/image2.jpg
    python similarity.py --text "A tree" --image path/to/tree.jpg
    python similarity.py --text "A dog" --url "https://picsum.photos/id/237/200/300"
"""

import argparse
import requests
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json
import sys
import os

BASE_URL = "http://localhost:5001"

def get_prompt_from_text(text):
    """Get prompt for text input"""

    prompt = f"Describe a photo taken at a construction site that clearly shows: {text}. Include details about materials, machinery, structures, colors, and environment typical of building sites."

    return prompt

def get_text_embedding(text):
    """Get embedding for text"""
    # prompt = get_prompt_from_text(text)
    prompt = text  # Use the text directly for embedding
    response = requests.post(
        f"{BASE_URL}/text",
        headers={"Content-Type": "application/json"},
        json={"text": prompt}
    )
    response.raise_for_status()
    return response.json()['embedding']

def get_image_embedding_file(image_path):
    """Get embedding for image file"""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")

    with open(image_path, 'rb') as f:
        files = {'image': f}
        response = requests.post(f"{BASE_URL}/image", files=files)
    response.raise_for_status()
    return response.json()['embedding']

def get_image_embedding_url(url):
    """Get embedding for image URL"""
    data = {'url': url}
    response = requests.post(f"{BASE_URL}/image", data=data)
    response.raise_for_status()
    return response.json()

def calculate_cosine_similarity(embedding1, embedding2):
    """Calculate cosine similarity between two embeddings"""
    # Convert to numpy arrays and reshape for sklearn
    emb1 = np.array(embedding1).reshape(1, -1)
    emb2 = np.array(embedding2).reshape(1, -1)

    similarity = cosine_similarity(emb1, emb2)[0][0]
    return similarity

def main():
    parser = argparse.ArgumentParser(description="Calculate similarity between embeddings")

    # Input options
    parser.add_argument("--text1", help="First text input")
    parser.add_argument("--text2", help="Second text input")
    parser.add_argument("--text", help="Text input (for text-image comparison)")
    parser.add_argument("--image1", help="First image file path")
    parser.add_argument("--image2", help="Second image file path")
    parser.add_argument("--image", help="Image file path (for text-image comparison)")
    parser.add_argument("--url", help="Image URL")

    args = parser.parse_args()

    try:
        # Determine comparison type and get embeddings
        if args.text1 and args.text2:
            # Text vs Text
            print("Comparing two texts...")
            print(f"Text 1: '{args.text1}'")
            print(f"Text 2: '{args.text2}'")

            emb1 = get_text_embedding(args.text1)
            emb2 = get_text_embedding(args.text2)

        elif args.image1 and args.image2:
            # Image vs Image
            print("Comparing two images...")
            print(f"Image 1: {args.image1}")
            print(f"Image 2: {args.image2}")

            emb1 = get_image_embedding_file(args.image1)
            emb2 = get_image_embedding_file(args.image2)

        elif args.text and args.image:
            # Text vs Image (file)
            print("Comparing text with image...")
            print(f"Text: '{args.text}'")
            print(f"Image: {args.image}")

            emb1 = get_text_embedding(args.text)
            emb2 = get_image_embedding_file(args.image)

        elif args.text and args.url:
            # Text vs Image (URL)
            print("Comparing text with image URL...")
            print(f"Text: '{args.text}'")
            print(f"Image URL: {args.url}")

            emb1 = get_text_embedding(args.text)
            emb2 = get_image_embedding_url(args.url)

        else:
            print("Error: Please provide valid input combinations:")
            print("  --text1 and --text2 (compare two texts)")
            print("  --image1 and --image2 (compare two images)")
            print("  --text and --image (compare text with image file)")
            print("  --text and --url (compare text with image URL)")
            sys.exit(1)

        # Calculate and display similarity
        similarity = calculate_cosine_similarity(emb1, emb2)

        print(f"\nCosine Similarity: {similarity:.4f}")
        print(f"Similarity Percentage: {similarity * 100:.2f}%")

        # Interpretation
        if similarity > 0.8:
            print("Interpretation: Very similar")
        elif similarity > 0.6:
            print("Interpretation: Moderately similar")
        elif similarity > 0.4:
            print("Interpretation: Somewhat similar")
        else:
            print("Interpretation: Not very similar")

    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to embedding service. Make sure it's running on localhost:5000")
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        print(f"Error: HTTP request failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()