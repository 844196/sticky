# vim: set filetype=ruby:

options = {
  :serve  => true,
  :drafts => true
}

guard 'jekyll-plus', options do
  watch %r{.*}
  ignore %r{^_site/}
end

guard 'livereload' do
  watch %r{.*}
end
