import { Mongo } from 'meteor/mongo';

export const Equations = new Mongo.Collection('equations');

export const Recordings = new Mongo.Collection('recordings'); //aka derivations
