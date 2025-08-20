'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, Star, Calendar, Globe, Play, FileText } from 'lucide-react';
import { Movie } from '@/types/movie';
import ClientOnlyVideoPlayer from './ClientOnlyVideoPlayer';
import Image from 'next/image';

interface MovieModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MovieModal({ movie, isOpen, onClose }: MovieModalProps) {
  if (!movie) return null;

  const handleDownload = (url: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || movie.title;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTitle = (title: string) => {
    return title.replace(/\(\d{4}\)/, '').trim();
  };

  const getQualityBadgeColor = (quality: string) => {
    const q = quality.toLowerCase();
    if (q.includes('4k') || q.includes('2160p')) return 'bg-purple-500';
    if (q.includes('1080p') || q.includes('fhd')) return 'bg-blue-500';
    if (q.includes('720p') || q.includes('hd')) return 'bg-green-500';
    if (q.includes('480p') || q.includes('sd')) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-gray-900 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                  <Dialog.Title as="h3" className="text-2xl font-bold text-white">
                    {formatTitle(movie.title)}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Video Player Section */}
                  {movie.downloadUrls && movie.downloadUrls.length > 0 ? (
                    <ClientOnlyVideoPlayer
                      sources={movie.downloadUrls}
                      poster={movie.poster}
                      title={movie.title}
                      onDownload={handleDownload}
                    />
                  ) : (
                    <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No video available</p>
                        <p className="text-sm">This movie doesn't have any playable video links.</p>
                      </div>
                    </div>
                  )}

                  {/* Movie Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Poster and Basic Info */}
                    <div className="space-y-4">
                      {movie.poster && (
                        <div className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden">
                          <Image
                            src={movie.poster}
                            alt={movie.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 33vw"
                            unoptimized={movie.poster.includes('discoveryftp.net') || movie.poster.includes('proxy/poster')}
                          />
                        </div>
                      )}

                      {/* Basic Info */}
                      <div className="space-y-3">
                        {movie.year && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4" />
                            <span>{movie.year}</span>
                          </div>
                        )}

                        {movie.language && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Globe className="w-4 h-4" />
                            <span>{movie.language}</span>
                          </div>
                        )}

                        {movie.rating && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{movie.rating}</span>
                          </div>
                        )}

                        {movie.size && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <FileText className="w-4 h-4" />
                            <span>{movie.size}</span>
                          </div>
                        )}

                        {movie.quality && (
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium ${getQualityBadgeColor(movie.quality)}`}>
                            {movie.quality.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Description and Details */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Description */}
                      {movie.description && (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
                          <p className="text-gray-300 leading-relaxed">{movie.description}</p>
                        </div>
                      )}

                      {/* Genres */}
                      {movie.genres.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Genres</h4>
                          <div className="flex flex-wrap gap-2">
                            {movie.genres.map((genre, index) => (
                              <span
                                key={index}
                                className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Download Links */}
                      {movie.downloadUrls.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-3">Download Links</h4>
                          <div className="space-y-2">
                            {movie.downloadUrls.map((download, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-gray-800 rounded-lg p-4"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getQualityBadgeColor(download.quality)}`}>
                                    {download.quality}
                                  </div>
                                  <span className="text-gray-300 text-sm">
                                    {download.format.toUpperCase()}
                                  </span>
                                  {download.label && (
                                    <span className="text-gray-400 text-sm">
                                      - {download.label}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDownload(download.url, `${movie.title}_${download.quality}.${download.format.toLowerCase()}`)}
                                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
