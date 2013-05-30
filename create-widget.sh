#! /bin/sh

if [ -e ./latitude.wgt ]; then 
    rm -v latitude.wgt
fi

# Zip all the html, javascript, CSS, images and other information.
zip -r latitude.wgt *.html ./js/*.js ./css/* ./fonts/* config.xml latitude.png -x *~ -x */*~


