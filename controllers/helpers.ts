import asyncHandler from 'express-async-handler'
import { validationResult } from 'express-validator'

export const sendErrorsIfAny = asyncHandler(async (req, res, next) => {
  const errorsArray = validationResult(req).array()
  if (errorsArray.length > 0) {
    res.status(422).json({
      errors: errorsArray.map((err) => {
        if (err.type === 'field') {
          return {
            path: err.path,
            value: err.value,
            msg: err.msg
          }
        } else return { msg: err.msg }
      })
    })
  } else next()
})

export const welcomeChannelMessages =
  [
    'Hello and welcome! 👋 Bonfires is a simple messaging web app. You can create camps, invite your friends, and share messages within your camps.',
    'Messages support some limited markdown. You can **bold**, *italicize*, and ~~strikethrough~~ your text. You can even send hyperlinks! Check out [this markdown document](https://commonmark.org/help/) for how to do those things.',
    'To add a friend to a camp, go to the **Settings** dropdown in the top right corner, and click on **Invite User**. Input your friend\'s username, and submit. Now you can hang out!',
    'You may have noticed that you\'re the Firestarter of this camp. What this means is that you have special admin powers over this camp - you can edit this channel\'s details, and kick members. If you\'re not interested in this role, you can pass it to another user, by going to the **Settings** dropdown in the top right corner, clicking **Promote User**, and inputting their username.',
    'This camp was automatically created for you to give you some tips. That\'s all from me - go forth and light up your world!'
  ]
