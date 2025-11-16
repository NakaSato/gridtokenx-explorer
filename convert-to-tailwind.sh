#!/bin/bash

# Script to convert Bootstrap classes to Tailwind CSS
# This performs bulk replacements of common Bootstrap patterns

find app -name "*.tsx" -type f | while read file; do
    # Skip if file doesn't contain any Bootstrap classes
    if ! grep -q "card-header\|btn btn-\|alert alert-\|badge bg-\|spinner-\|dropdown-\|form-control\|text-muted[^-]" "$file"; then
        continue
    fi
    
    echo "Converting: $file"
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Card conversions
    sed -i.tmp 's/className="card"/className="bg-card border rounded-lg shadow-sm"/g' "$file"
    sed -i.tmp 's/className="card mb-4"/className="bg-card border rounded-lg shadow-sm mb-4"/g' "$file"
    sed -i.tmp 's/className="card mt-4"/className="bg-card border rounded-lg shadow-sm mt-4"/g' "$file"
    sed -i.tmp 's/className="card-header"/className="px-6 py-4 border-b"/g' "$file"
    sed -i.tmp 's/className="card-header align-items-center"/className="px-6 py-4 border-b flex items-center"/g' "$file"
    sed -i.tmp 's/className="card-header-title"/className="text-lg font-semibold"/g' "$file"
    sed -i.tmp 's/className="card-header-title mb-0 flex items-center"/className="text-lg font-semibold mb-0 flex items-center"/g' "$file"
    sed -i.tmp 's/className="card-body"/className="p-6"/g' "$file"
    sed -i.tmp 's/className="card-body text-center"/className="p-6 text-center"/g' "$file"
    sed -i.tmp 's/className="card-body p-0 overflow-x-scroll"/className="p-0 overflow-x-scroll"/g' "$file"
    sed -i.tmp 's/className="card-footer"/className="px-6 py-4 border-t"/g' "$file"
    sed -i.tmp 's/className="card-title"/className="text-lg font-semibold"/g' "$file"
    
    # Button conversions
    sed -i.tmp 's/className="btn btn-white btn-sm"/className="bg-white text-black border px-3 py-1.5 rounded-md hover:bg-gray-100 text-sm"/g' "$file"
    sed -i.tmp 's/className="btn btn-primary"/className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary\/90"/g' "$file"
    sed -i.tmp 's/className="btn btn-primary w-100"/className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary\/90 w-full"/g' "$file"
    sed -i.tmp 's/className="btn btn-sm btn-primary"/className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary\/90"/g' "$file"
    sed -i.tmp 's/className="btn btn-sm btn-white"/className="px-3 py-1.5 text-sm bg-white text-black border rounded-md hover:bg-gray-100"/g' "$file"
    sed -i.tmp 's/className="btn btn-dark btn-sm/className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700/g' "$file"
    
    # Table conversions
    sed -i.tmp 's/className="tablresponsive mb-0"/className="overflow-x-auto mb-0"/g' "$file"
    sed -i.tmp 's/className="tablresponsive"/className="overflow-x-auto"/g' "$file"
    sed -i.tmp 's/className="table tablsm tablnowrap card-table"/className="w-full text-sm"/g' "$file"
    sed -i.tmp 's/className="table tablsm"/className="w-full text-sm"/g' "$file"
    sed -i.tmp 's/className="w-100"/className="w-full"/g' "$file"
    
    # Alert conversions
    sed -i.tmp 's/className="alert alert-warning"/className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md"/g' "$file"
    sed -i.tmp 's/className="alert alert-info"/className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md"/g' "$file"
    sed -i.tmp 's/className="alert alert-danger"/className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md"/g' "$file"
    sed -i.tmp 's/className="alert alert-success"/className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md"/g' "$file"
    sed -i.tmp 's/className="alert mt-2 mb-2"/className="px-4 py-3 rounded-md mt-2 mb-2"/g' "$file"
    
    # Badge conversions
    sed -i.tmp 's/className="badge bg-primary"/className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"/g' "$file"
    sed -i.tmp 's/className="badge bg-success"/className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"/g' "$file"
    sed -i.tmp 's/className="badge bg-danger"/className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs"/g' "$file"
    sed -i.tmp 's/className="badge bg-warning"/className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs"/g' "$file"
    sed -i.tmp 's/className="badge bg-info"/className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"/g' "$file"
    sed -i.tmp 's/className="badge bg-secondary"/className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs"/g' "$file"
    sed -i.tmp 's/className="badge bg-success-soft"/className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs"/g' "$file"
    sed -i.tmp 's/className="badge bg-danger-soft"/className="bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs"/g' "$file"
    sed -i.tmp 's/className="badge bg-info-soft"/className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"/g' "$file"
    sed -i.tmp 's/className="badge badgpill bg-dark"/className="px-2 py-1 rounded-full text-xs bg-gray-800 text-white"/g' "$file"
    sed -i.tmp 's/className="badge bg-gray-soft badgpill"/className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"/g' "$file"
    
    # Spacing conversions
    sed -i.tmp 's/ className="align-text-top m2"/ className="align-text-top mr-2"/g' "$file"
    sed -i.tmp 's/ className="m2 / className="mr-2 /g' "$file"
    sed -i.tmp 's/ className="ms-1"/ className="ml-1"/g' "$file"
    sed -i.tmp 's/ className="ms-2"/ className="ml-2"/g' "$file"
    sed -i.tmp 's/ className="ms-3"/ className="ml-3"/g' "$file"
    sed -i.tmp 's/ className="me-2"/ className="mr-2"/g' "$file"
    sed -i.tmp 's/ className="mt-2"/ className="mt-2"/g' "$file"
    sed -i.tmp 's/ className="mb-0"/ className="mb-0"/g' "$file"
    sed -i.tmp 's/ className="mb-2"/ className="mb-2"/g' "$file"
    sed -i.tmp 's/ className="mb-3"/ className="mb-3"/g' "$file"
    sed -i.tmp 's/ className="mb-4"/ className="mb-4"/g' "$file"
    
    # Text conversions
    sed -i.tmp 's/ className="text-muted"/ className="text-muted-foreground"/g' "$file"
    sed -i.tmp 's/ className="text-end"/ className="text-right"/g' "$file"
    
    # Dropdown conversions
    sed -i.tmp 's/className="dropdown-menu-end dropdown-menu"/className="absolute right-0 mt-2 bg-white border rounded-md shadow-lg"/g' "$file"
    sed -i.tmp 's/className="dropdown-menu"/className="bg-white border rounded-md shadow-lg"/g' "$file"
    sed -i.tmp 's/className="dropdown-item/className="block px-4 py-2 hover:bg-gray-100/g' "$file"
    sed -i.tmp 's/className="dropdown-header /className="px-4 py-2 font-semibold /g' "$file"
    
    # Form conversions
    sed -i.tmp 's/className="form-control"/className="w-full border rounded-md px-3 py-2"/g' "$file"
    sed -i.tmp 's/className="form-label"/className="block text-sm font-medium mb-2"/g' "$file"
    
    # Spinner conversions
    sed -i.tmp 's/className="spinner-border text-primary"/className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/g' "$file"
    sed -i.tmp 's/className="spinner-border spinner-border-sm m2"/className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"/g' "$file"
    sed -i.tmp 's/className="spinner-grow spinner-grow-sm"/className="inline-block w-4 h-4 bg-current rounded-full animate-pulse"/g' "$file"
    sed -i.tmp 's/className="align-text-top spinner-grow spinner-grow-sm m2"/className="inline-block w-4 h-4 bg-current rounded-full animate-pulse align-text-top mr-2"/g' "$file"
    
    # Row/Col conversions - be more specific to avoid false matches
    sed -i.tmp 's/className="row align-items-center"/className="flex items-center"/g' "$file"
    sed -i.tmp 's/className="col-auto"/className="flex-shrink-0"/g' "$file"
    sed -i.tmp 's/className="col"/className="flex-1"/g' "$file"
    sed -i.tmp 's/className="d-flex align-items-center"/className="flex items-center"/g' "$file"
    sed -i.tmp 's/className="d-inlinflex align-items-center ms-2"/className="inline-flex items-center ml-2"/g' "$file"
    
    # Layout conversions
    sed -i.tmp 's/className="d-none d-md-inline"/className="hidden md:inline"/g' "$file"
    
    # Remove temp files
    rm -f "$file.tmp"
    
done

echo "Conversion complete! Backup files created with .bak extension"
echo "To remove backups: find app -name '*.bak' -delete"
