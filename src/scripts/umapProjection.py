#!/usr/bin/env python3
"""
UMAP Projection Script
Projects high-dimensional embeddings to 2D using UMAP
"""

import sys
import json
import numpy as np

try:
    import umap
except ImportError:
    print("Error: umap-learn not installed. Run: pip install umap-learn", file=sys.stderr)
    sys.exit(1)


def project_embeddings(embeddings_data, n_neighbors=15, min_dist=0.1, metric='cosine'):
    """
    Project embeddings to 2D using UMAP
    
    Args:
        embeddings_data: List of dicts with 'id' and 'embedding' keys
        n_neighbors: UMAP parameter (default 15)
        min_dist: UMAP parameter (default 0.1)
        metric: Distance metric (default 'cosine')
    
    Returns:
        List of dicts with 'id', 'x', 'y' keys
    """
    # Extract embeddings and IDs
    ids = [item['id'] for item in embeddings_data]
    embeddings = np.array([item['embedding'] for item in embeddings_data])
    
    print(f"Projecting {len(embeddings)} embeddings from {embeddings.shape[1]}D to 2D", file=sys.stderr)
    
    # Create UMAP reducer
    reducer = umap.UMAP(
        n_neighbors=n_neighbors,
        min_dist=min_dist,
        n_components=2,
        metric=metric,
        random_state=42,
        verbose=True
    )
    
    # Fit and transform
    projected = reducer.fit_transform(embeddings)
    
    # Format results
    results = []
    for i, node_id in enumerate(ids):
        results.append({
            'id': node_id,
            'x': float(projected[i, 0]),
            'y': float(projected[i, 1])
        })
    
    print(f"Projection complete", file=sys.stderr)
    
    return results


def main():
    """
    Main function - reads JSON from stdin, projects, outputs JSON to stdout
    """
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        # Get parameters (optional)
        n_neighbors = input_data.get('n_neighbors', 15)
        min_dist = input_data.get('min_dist', 0.1)
        metric = input_data.get('metric', 'cosine')
        embeddings_data = input_data['embeddings']
        
        # Project
        results = project_embeddings(embeddings_data, n_neighbors, min_dist, metric)
        
        # Output results as JSON
        json.dump(results, sys.stdout)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

